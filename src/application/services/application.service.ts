import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, LessThanOrEqual, Repository } from "typeorm";
import { Application } from "../entities/application.entity";
import { Applicant } from "../entities/applicant.entity";
import { ApplicantFormDTO } from "../DTOs/applicantForm.dto";
import { ApplicantUpdateFormDto } from "../DTOs/applicantUpdateForm.dto";
import { ApplyFormDto } from "../DTOs/applyForm.dto";
import { ReedService } from "../../thirdPartyApi/services/reed.service";
import { CvLibService } from "../../thirdPartyApi/services/cvLib.service";
import { TotalJobsService } from "../../thirdPartyApi/services/totalJobs.service";
import { ClownFishService } from "../../thirdPartyApi/services/clownFish.service";
import { basename } from "path";
import { readFileSync } from "fs";
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { ApplicantType } from "../enums";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        public applicationRepository: Repository<Application>,
        @InjectRepository(Applicant)
        public applicantRepository: Repository<Applicant>,
        @InjectRepository(User) public userRepository: Repository<User>,
        private readonly reedService: ReedService,
        private readonly cvLibService: CvLibService,
        private readonly totalJobsService: TotalJobsService,
        private readonly clownFishService: ClownFishService
    ) {
    }

    async getApplications(
        search?: string,
        start = 0,
        limit = 60
    ): Promise<any> {
        let where = {};

        if (search) {
            where = {
                firstName: ILike(`${search}%`),
                lastName: ILike(`${search}%`)
            };
        }

        const total = await this.applicantRepository.count({
            where
        });

        let applicants: any[] = await this.applicantRepository.find({
            relations: ["applications"],
            skip: start,
            take: limit
        });

        applicants = applicants.map((applicant: any) => {
            let total = 0;
            applicant.applications.forEach(
                (app) => (total = total + app.applyCount)
            );
            applicant.count = total;
            return applicant;
        });

        return {
            total: total,
            start: start,
            limit: limit,
            filtered: applicants.length,
            data: applicants
        };
    }

    async saveApplicant(data: ApplicantFormDTO, file: Express.Multer.File) {
        data.userId = new Date().getTime();
        // check in that db if there is already saved in the database then don't create the auto generated email
        if (data.email != null || data.email != undefined) {
            const generatedEmail = await this.clownFishService.generateEmail(
                data.firstName,
                data.lastName,
                data.email
            );
            if (generatedEmail != undefined) {
                data.email = generatedEmail;
            }
        }

        let applicant = await this.applicantRepository.findOne({
            where: {
                email: data.email
            }
        });

        if (!applicant) {
            // insert into db
            applicant = new Applicant();
            applicant.userId = data.userId;
            applicant.lastName = data.lastName;
            applicant.firstName = data.firstName;
            applicant.email = data.email;
            applicant.county = data.county;
            applicant.postcode = data.postcode;
            applicant.town = data.town;
            applicant.desiredJob = data.desiredJob;
            applicant.desiredMinSalary = data.desiredMinSalary;
            applicant.salaryRange = data.salaryRange;
            applicant.jobType = data.jobType;
            applicant.coverContent = data.coverContent;
            applicant.autoApply = false;
            applicant.type = ApplicantType.MANUAL;

            await this.applicantRepository.save(applicant);
        } else data.userId = applicant.id;

        if (data.email) {
            const promises = [
                this.totalJobsService.signup(data, file),
                this.reedService.signup(data, file),
                this.cvLibService.signup(data, file)
            ];
            await Promise.all(promises);
        } else {
            console.error("No email address found.");
            throw new BadRequestException("No email address found.");
        }

        return applicant;
    }

    async createApplicantFromUser(user: User) {
        const fileBuffer = readFileSync(user.cvUrl);

        const file = {
            fieldname: "file",
            originalname: basename(user.cvUrl),
            encoding: "utf8",
            mimetype: "application/pdf",
            buffer: fileBuffer,
            size: fileBuffer.length
        };

        user.cvLibEmail = "random@gmail.com";
        user.reedEmail = "random@gmail.com";
        await this.userRepository.save(user);

        try {
            const generatedEmail = await this.clownFishService.generateEmail(
                user.firstName,
                user.lastName,
                user.email
            );

            user.cvLibUserId = user.cvLibUserId ?? new Date().getTime();
            user.cvLibEmail = generatedEmail;

            user.reedUserId = user.cvLibUserId ?? new Date().getTime();
            user.reedEmail = generatedEmail;

            await this.userRepository.save(user);

            const bal = [];

            bal.push(
                this.reedService.signup(
                    {
                        email: user.cvLibEmail,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        postcode: user.postcode,
                        county: user.county,
                        town: user.location,
                        desiredJob: user.jobTarget1 ?? user.targetRole,
                        phone: user.phone,
                        desiredMinSalary: user.currentSalary
                    },
                    file
                )
            );

            bal.push(
                this.cvLibService.signup(
                    {
                        email: user.cvLibEmail,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        postcode: user.postcode,
                        desiredJob: user.jobTarget1 ?? user.targetRole,
                        phone: user.phone
                    },
                    file
                )
            );

            await Promise.all(bal);
        } catch (err) {
            console.warn("CV or REED signup failed. Reverse!");
            if (user.cvLibEmail === "random@gmail.com")
                user.cvLibEmail = undefined;
            if (user.reedEmail === "random@gmail.com")
                user.reedEmail = undefined;
            await this.userRepository.save(user);
            throw err;
        }

        const applicant = new Applicant();
        applicant.userId = user.cvLibUserId;
        applicant.lastName = user.lastName;
        applicant.firstName = user.firstName;
        applicant.email = user.email;
        applicant.county = user.location;
        applicant.postcode = user.postcode;
        applicant.town = user.location;
        applicant.desiredJob = user.jobTarget1;

        try {
            applicant.desiredMinSalary = parseInt(user.currentSalary);
        } catch (err) {
            console.warn(
                "Failed to parse salary from string to integer",
                user.currentSalary
            );
        }

        if (!applicant.desiredMinSalary || isNaN(applicant.desiredMinSalary))
            applicant.desiredMinSalary = 25000;

        // applicant.salaryRange = user.salaryRange;
        applicant.jobType = "1";
        applicant.coverContent = user.profileSummary;
        applicant.autoApply = false;
        applicant.type = ApplicantType.AUTO;

        await this.applicantRepository.save(applicant);
    }

    async getAutoApplyApplicants() {
        return await this.applicantRepository.find({
            where: {
                autoApply: true
            }
        });
    }

    async getLastApply(userId: number) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);

        // console.log("sevenDaysAgo", sevenDaysAgo);

        const apply = await this.applicationRepository.findOne({
            where: {
                userId: userId,
                createdAt: LessThanOrEqual(sevenDaysAgo)
            },
            order: {
                createdAt: "DESC"
            }
        });
        return apply;
    }

    async updateApplicant(data: ApplicantUpdateFormDto, userId: number) {
        const applicant = await this.applicantRepository.findOne({
            where: {
                userId: userId
            }
        });
        applicant.desiredJob = data.desiredJob;
        applicant.county = data.county;
        return await this.applicantRepository.save(applicant);
    }

    async getApplicant(userId: number) {
        return await this.applicantRepository.findOne({
            where: {
                userId: userId
            }
        });
    }

    async toggleAutoApply(userId: number, value: boolean) {
        const applicant = await this.applicantRepository.findOne({
            where: {
                userId: userId
            }
        });

        applicant.autoApply = value;
        return await this.applicantRepository.save(applicant);
    }

    async getApplicantDetails(userId: number) {
        return await this.applicationRepository
            .createQueryBuilder("app")
            .select([
                "DATE(app.createdAt) AS date",
                "SUM(app.applyCount) AS count"
            ])
            .where("app.userId = :userId", { userId })
            .groupBy("DATE(app.createdAt)")
            .getRawMany();
    }

    async updateCv(userId: number, email: string, file: Express.Multer.File) {
        const promises = [
            this.reedService.updateCV(email, file),
            this.cvLibService.updateCV(userId, email, file),
            this.totalJobsService.updateCV(email, file)
        ];

        const [responseTotalJobs, responseReed, responseCVLib] =
            await Promise.all(promises);

        return { message: "CV updated successfully" };
    }

    async applyJob(applyForm: ApplyFormDto) {
        if (applyForm.email != undefined) {
            const promises = [
                this.reedService.scrapAndApplyJobs(applyForm),
                this.cvLibService.scrapAndApplyJobs(applyForm),
                this.totalJobsService.scrapAndApplyJobs(applyForm)
            ];
            const [totalJobsScrapeRes, responseReedApply, scrapeCVLibJobsRes] =
                await Promise.all(promises);
            return { message: "Job application process completed." };
        } else throw new BadRequestException("Email address is missing.");
    }
}
