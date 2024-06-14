import { Injectable } from "@nestjs/common";

import { API_STATUS } from "src/globals/enums";
import { HelpChoosePlanDTO, IndividualServicesCheckoutDTO } from "../DTOs";
import { discounts, individualServices, packages } from "../constants";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { EmailSendingService } from "src/emails/services/email.service";
import { Repository } from "typeorm";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ServicesService {
    private readonly stripe: Stripe;

    constructor(
        @InjectRepository(User)
        public userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly emailService: EmailSendingService
    ) {
        const stripeSecretKey =
            this.configService.get<string>("STRIPE_SECRET_KEY");
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: null as any
        });
    }

    /**
     * The `helpChoosePlan` function returns recommended plan based on the answers of the users
     * @param {HelpChoosePlanDTO} helpChoosePlanDTO - The `helpChoosePlanDTO` parameter is an object
     * that contains one field `questions` and that further contains the following questions:<br>
     *
     * * currentStatus: CurrentStatus
     *
     * @returns a Promise that resolves to an ApiResponse object.
     */
    helpChoosePlan(helpChoosePlanDTO: HelpChoosePlanDTO) {
        const currentStatus = helpChoosePlanDTO.currentStatus;
        const haveCV = helpChoosePlanDTO.haveCV;
        const needCoverLetter = helpChoosePlanDTO.needCoverLetter;
        const needLinkedInOpt = helpChoosePlanDTO.needLinkedInOpt;

        const tailoredApplications = helpChoosePlanDTO.tailoredApplications;
        const needPreparation = helpChoosePlanDTO.needPreparation;
        const cvCirculation = helpChoosePlanDTO.cvCirculation;
        const discountValue =
            discounts[currentStatus as keyof typeof discounts].value || 0;

        // Calculate total cost for individual services
        let totalCost = 0;
        const selectedServices = [];
        if (haveCV !== "noNeedCV") {
            totalCost += individualServices["Bespoke CV"];
            selectedServices.push("Bespoke CV");
        }

        if (needCoverLetter) {
            totalCost += individualServices["Cover Letter"];
            selectedServices.push("Cover Letter");
        }
        if (needLinkedInOpt) {
            totalCost += individualServices["LinkedIn Optimisation"];
            selectedServices.push("LinkedIn Optimisation");
        }
        if (tailoredApplications) {
            totalCost += individualServices["ApplyMate"];
            selectedServices.push("ApplyMate");
        }
        if (needPreparation) {
            totalCost += individualServices["Interview Preparation"];
            selectedServices.push("Interview Preparation");
        }
        if (cvCirculation) {
            totalCost += individualServices["CV Circulation"];
            selectedServices.push("CV Circulation");
        }

        // totalCost -= totalCost * discountValue;

        // Find the best package
        let bestPackage = null;
        let bestPackageCost = Number.MAX_VALUE;

        for (const packageName in packages) {
            const packageServices =
                packages[packageName as keyof typeof packages].inc;
            const isEligible = selectedServices.every((service) =>
                packageServices.includes(service)
            );
            const packageCost =
                packages[packageName as keyof typeof packages].cost -
                packages[packageName as keyof typeof packages].cost *
                    discountValue;

            if (isEligible && packageCost < bestPackageCost) {
                bestPackage = packageName;
                bestPackageCost = packageCost;
            }
        }

        // Determine the best option
        const bestOption =
            bestPackageCost < totalCost ? bestPackage : "Individual Services";
        const bestPrice =
            bestPackageCost < totalCost ? bestPackageCost : totalCost;

        return {
            status: API_STATUS.SUCCESS,
            message: "Recommended Plan Calculated",
            data: {
                bestOption,
                selectedServices,
                totalCost: totalCost.toFixed(2),
                bestPrice: bestPrice.toFixed(2)
            }
        };
    }

    /**
     * The `helpChoosePlan` function returns recommended plan based on the user's selections of the services
     * that he wants
     * @param userId
     * @param {IndividualServicesCheckoutDTO} individualServicesCheckoutDTO - The `individualServicesCheckoutDTO` parameter is an object
     * that contains one field `services` that is an array of `IndividualServices`
     * @returns a Promise that resolves to an ApiResponse object.
     */
    async individualServicesCheckout(
        userId: string,
        individualServicesCheckoutDTO: IndividualServicesCheckoutDTO
    ) {
        function countOccurrences(
            array: string[],
            singlePackage: string[]
        ): [number, string[]] {
            let count = 0;
            while (singlePackage.every((val) => array.includes(val))) {
                count++;
                singlePackage.forEach((item) => {
                    const index = array.indexOf(item);
                    array.splice(index, 1);
                });
            }
            return [count, array];
        }

        let totalCost = 0;
        let multiPackageDiscount = 0;
        let discountedPrice = 0;
        let savings = 0;
        const bestPackage = [];
        let extraServices = [];
        let packageName = null;

        const services = individualServicesCheckoutDTO.services;

        // Count the occurrences of each service and calculate totalCost
        for (const service of services) {
            totalCost += individualServices[service];
        }

        // Find the best matching package
        const tempServices = [...services];

        const matchingPackages = Object.entries(packages)
            .map((singlePackage, index) => {
                const [count, remainingItems] = countOccurrences(
                    tempServices,
                    singlePackage[1].inc
                );
                if (
                    index == Object.entries(packages).length - 1 &&
                    count == 0
                ) {
                    extraServices = remainingItems;
                }
                return {
                    [singlePackage[0]]: singlePackage[1],
                    count,
                    remainingItems
                };
            })
            .filter((result) => result.count > 0);

        // Calculate additional services
        extraServices = matchingPackages[0]?.remainingItems || extraServices;
        for (const extraService of extraServices) {
            discountedPrice += individualServices[extraService];
        }

        // Getting price of Matching Packages
        matchingPackages.map((pack) => {
            const [packName, count, _] = Object.keys(pack);
            if (packageName === null) {
                packageName = packName;
            }
            bestPackage.push(pack[0]);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            discountedPrice += pack[packName].cost * pack.count;
        });
        // Calculate multi-package discount for 2 Bespoke CVs
        if (
            services.filter((service) => service === "Bespoke CV").length >= 2
        ) {
            multiPackageDiscount = 0.2;
        }

        if (multiPackageDiscount !== 0) {
            discountedPrice = discountedPrice * (1 - multiPackageDiscount);
        }
        savings = (totalCost - discountedPrice) / totalCost;

        const keys = Object.keys(packages);
        const startIndex = keys.indexOf(packageName);
        const clonedPackages = { ...packages };

        keys.slice(startIndex).forEach((key) => {
            keys.pop();
            delete clonedPackages[key];
        });
        keys.reverse();
        const nextPackage = keys.shift();
        let servicesToNextPackage = null;
        if (nextPackage) {
            const nextPackServices = packages[nextPackage].inc;
            servicesToNextPackage = nextPackServices.filter(
                (x) => !services.includes(x)
            );
        } else {
            servicesToNextPackage = "No Service";
        }

        // TODO : save in db
        const user = await this.userRepository.findOne({
            where: {
                userId
            }
        });

        const query = {
            limit: 50
        } as any;
        const products = await this.stripe.products.list(query);

        let packageId = null;
        let priceId = null;

        if (products?.data?.length) {
            const calculatedPackage = products.data.find((item) => {
                return item.name === packageName;
            });

            packageId = calculatedPackage?.id;
            priceId = calculatedPackage?.default_price;
        }

        user.basket = JSON.stringify({
            productId: packageId,
            priceId,
            packageName,
            totalCost,
            paymentStatus: "pending",
            multiPackageDiscount,
            savings,
            discountedPrice,
            nextPackage: nextPackage || "No Package",
            servicesToNextPackage,
            actualServices: services
        });

        await this.userRepository.save(user);

        return {
            status: API_STATUS.SUCCESS,
            message: "Recommended Plan Calculated",
            data: {
                packageName,
                totalCost,
                multiPackageDiscount,
                savings,
                discountedPrice,
                nextPackage: nextPackage || "No Package",
                servicesToNextPackage
            }
        };
    }

    async moveToNextService({ userId }) {
        const user = await this.userRepository
            .createQueryBuilder("user")
            .where("user.userId = :userId", { userId })
            .getOne();

        if (!user) {
            return {
                status: API_STATUS.FAILURE,
                message: "User not found",
                statusCode: 400
            };
        }
        const payload = {
            // email: string,
            // fullName: string,
            // textBody: string,
            // subject: string,
            // cVSpecialistName: string
            email: user.email,
            // fullName: `${user.firstName} ${user.lastName}`,
            fullName: `${user.firstName.charAt(0).toUpperCase()}${user.firstName.slice(1).toLowerCase()}`,
            textBody: "Your service has been moved to the next stage",
            subject: "Service Moved to Next Stage",
            cVSpecialistName: "CV Specialist"
        };

        if (user.cvSpecialistId) {
            const cvSpecialist = await this.userRepository.findOne({
                where: {
                    userId: user.cvSpecialistId
                }
            });

            payload.cVSpecialistName = `${cvSpecialist.firstName} ${cvSpecialist.lastName}`;
        }

        const emailTemplates = [
            {
                service: "Bespoke CV",
                subject: "Draft CV",
                body: `
              <p>Your initial CV draft, attached here, is ready for review. Please find the draft attached to this email.</p>
              <p>Please note the CV contains speculative content.</p>
              <p><strong><u>I encourage you to send your proposed amendments directly via email to facilitate a more efficient revision process.</u></strong></p>
              <p><strong><u>To write commentary on the word file, please right-click on the section and select 'New Comment' option.</u></strong></p>
              <p>Once you finalise the CV, we can send through the Cover Letter, optimise the LinkedIn Profile, and subsequently complete the rest of your package.</p>
              <p>Looking forward to your feedback.</p>
            `
            },
            {
                service: "Cover Letter",
                subject: "Cover Letter",
                body: `
              <p>Please see attached your cover letter. If you require any amendments, please do let me know.</p>
            `
            },
            {
                service: "LinkedIn Optimisation",
                subject:
                    "Your LinkedIn Has Been Optimised and Employment Guide",
                body: `
              <p>I am pleased to inform you that we have successfully completed all optimisations on your LinkedIn account. Our primary goal was to enhance your profile's visibility and make it more attractive to recruiters and potential employers.</p>
              <p>Here is a summary of the key improvements we have made to your profile:</p>
              <ul>
                <li><strong>CV Upload:</strong> To provide a comprehensive overview of your professional experience, we have uploaded your latest CV to your LinkedIn profile. This allows interested recruiters and employers to easily access and review your qualifications, giving them a better understanding of your capabilities and suitability for their job openings.</li>
                <li><strong>Connections and Engagement:</strong> We have established follows and connections to engage with distinguished recruitment consultants across a diverse range of organisations. This will help expand your professional network and increase the likelihood of potential job opportunities coming your way.</li>
                <li><strong>Skills Optimisation:</strong> We have optimised the skills section of your profile by incorporating specific keywords relevant to your industry and expertise. This will make your profile more visible to recruiters who are searching for candidates with your particular skill set.</li>
                <li><strong>Settings Adjustments:</strong> We have updated your profile settings to make it easier for recruiters to find you and understand the types of roles you are interested in. This will help ensure that you receive more targeted job opportunities that align with your career goals.</li>
              </ul>
              <p>One additional recommendation we have for you is to upload a recent profile picture as it significantly increases the chances of recruiters reaching out to you, since it adds a personal touch and makes your profile more approachable.</p>
              <p>The ApplyMate team is continuing to make Tailored Applications on your behalf, based on your Target Roles.</p>
              <p>You will be notified directly with all Interview Requests, as soon as.</p>
              <p>Please bear in mind that our Application Process prevents Duplications, and as such, you are free to make any Applications you see fit as well.</p>
              <p>In the meantime, I would also advise that you upload your CV to recruiters & hiring managers via several sites (if you have not done so already):</p>
              <ul>
                <li>reed.co.uk</li>
                <li>indeed.co.uk</li>
                <li>CV-Library.co.uk</li>
                <li>Monster.co.uk</li>
                <li>totaljobs.com</li>
              </ul>
              <p>Please note that even though a role may not seem right for you, as a recruiter, I would highly advise that you submit as many applications as you can.</p>
              <p>On nearly all occasions, recruiters will save your CV for future roles they may have, and thus having your CV on hand, will enable them to get in touch with you.</p>
              <p>Additionally, you should log in to recruitment sites every 2-3 days, as these sites work on ‘Last Seen’ settings.</p>
              <p>Recruiters will understand that you are still looking for a job, and if they are hiring for a role which is relevant to you, they will get in touch.</p>
              <p>Once you have secured an interview please get in touch with us as we provide exceptional Mock Interview Preparation.</p>
              <p>Hope this helps.</p>
            `
            },
            {
                service: "ApplyMate",
                subject: "ApplyMate - Job Application Process Commenced",
                body: `
              <p>We are thrilled to inform you that we have commenced the process of applying for jobs on your behalf, leveraging our innovative ApplyMate Service. Here's a brief overview of what to expect:</p>
              <ul>
                <li><strong>Notifications from Job Sites:</strong> As we apply for multiple roles, amongst your specified Target Roles, you will typically receive notifications from job sites regarding the applications made.</li>
                <li><strong>Auto-Apply System:</strong> Our unique system efficiently uploads your CV and strategically selects positions where your profile scores highest on the ATS. This maximises your chances of landing interviews for the most suitable roles.</li>
                <li><strong>Recruiter Engagement:</strong> Bear in mind that recruiters, motivated by commission, may actively reach out to you. This is a normal part of the process and can be a valuable opportunity to discuss potential roles further.</li>
              </ul>
              <p><strong>Disclaimer:</strong> Our Partner Jobsites & Partner Firms are expected to inform you of each Application made on your behalf, however, this may not be the case in all circumstances.</p>
              <p>As a result, you may receive phone calls from Recruiters & Hiring Professionals regarding an Application you may not be aware of.</p>
              <p>In such situations, we advise accepting the call, explaining that you have made multiple Applications, and requesting elaboration on the role.</p>
              <p>A typical response often made by our Clients include:</p>
              <p>Thank you very much for the call. I have made several applications. Can you tell me a little bit about the role, and I would love to have a discussion regarding the opportunity.</p>
              <p>We are committed to supporting you every step of the way and are just a call, text or email away, should you have any questions or require assistance.</p>
              <p>Wishing you the best in your job search.</p>
            `
            },
            {
                service: "CV Circulation",
                subject:
                    "CV Circulation Update: Your Profile Shared with Top Recruitment Agencies",
                body: `
              <p>I am delighted to inform you that we have successfully initiated the CV circulation process as part of our dedicated service. Your profile has been shared with a handpicked selection of leading recruitment agencies, tailored to your career aspirations. Here's a brief outline of what this entails:</p>
              <ul>
                <li><strong>Agency Engagement:</strong> Your CV is now with top recruitment firms, which specialise in your field. These agencies are equipped to match your profile with prospective employers looking for candidates like you.</li>
                <li><strong>Potential Contact:</strong> Recruitment consultants may directly reach out to you regarding specific opportunities. These interactions are a pivotal part of the process, offering you the chance to discuss roles that align with your career goals.</li>
                <li><strong>Ongoing Support:</strong> We remain committed to assisting you throughout this journey. Should you need advice or have any queries, do not hesitate to contact us via call, text, or email.</li>
              </ul>
              <p>Please be aware that whilst we have circulated your CV to numerous agencies, the response time may vary.</p>
              <p>In case you receive a call from an agency you do not recognise, we recommend engaging with them. A simple approach is to express gratitude for the call, confirm your interest in exploring relevant opportunities, and enquire about the specific role they have in mind.</p>
            `
            }
        ];

        if (!user?.purchased) {
            return {
                status: API_STATUS.FAILURE,
                message: "No purchased services found",
                statusCode: 400
            };
        }

        try {
            JSON.parse(user?.purchased);
        } catch (error) {
            return {
                status: API_STATUS.FAILURE,
                message: "Purchased services are not in correct format",
                statusCode: 400
            };
        }

        const purchased = JSON.parse(user?.purchased);

        console.log("purchased: ", purchased);

        const inProgressIndex = purchased?.actualServices?.findIndex(
            (service) => service.status === "In Progress"
        );

        if (inProgressIndex !== -1) {
            purchased.actualServices[inProgressIndex].status =
                `Completed on ${new Date().toISOString()}`;

            const findEmailTemplate = emailTemplates.find(
                (template) =>
                    template.service ===
                    purchased.actualServices[inProgressIndex].name
            );

            if (findEmailTemplate) {
                const emailPayload = {
                    ...payload,
                    textBody: findEmailTemplate.body,
                    subject: findEmailTemplate.subject
                };

                await this.emailService.sendServiceCompleteEmailToUser(
                    emailPayload
                );
            }

            if (inProgressIndex + 1 < purchased?.actualServices?.length) {
                purchased.actualServices[inProgressIndex + 1].status =
                    "In Progress";
            }
        } else {
            // check if all the services are already completed
            const ifAllCompleted = purchased?.actualServices?.every((service) =>
                service.status.includes("Completed")
            );

            if (ifAllCompleted) {
                return {
                    status: API_STATUS.FAILURE,
                    message: "All services are already completed",
                    statusCode: 400
                };
            } else {
                purchased.actualServices[0].status = "In Progress";
            }
        }

        user.purchased = JSON.stringify(purchased);

        const updatedUser = await this.userRepository.save(user);

        return {
            status: API_STATUS.SUCCESS,
            message: "Service moved to next stage",
            data: purchased,
            statusCode: 201
        };
    }

    async getServices(userId?: string) {
        const query = await this.userRepository
            .createQueryBuilder("user")
            .where("user.purchased IS NOT NULL");

        if (userId) {
            query.where("user.userId = :userId", { userId });
        }

        const users = await query.getMany();

        const data = users
            .filter((user) => {
                try {
                    JSON.parse(user.purchased);
                    return true;
                } catch (error) {
                    return false;
                }
            })
            .map((user) => ({
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                purchased: JSON.parse(user.purchased)
            }))
            .filter((user) => user.purchased?.paymentStatus === "paid");

        if (userId && data.length === 0) {
            return {
                status: API_STATUS.FAILURE,
                message: "No services found for the user",
                statusCode: 400
            };
        }

        return {
            status: API_STATUS.SUCCESS,
            message: "Services fetched successfully",
            data,
            statusCode: 200
        };
    }
}
