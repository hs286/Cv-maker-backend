import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { ApplyFormDto } from "../../application/DTOs/applyForm.dto";
import { ScrapeSource } from "../../auth/0auth2.0/enums";
import { CommonApplicationService } from "./commonApplication.service";
import * as process from "process";
import { JobScrapperDto } from "../../jobScrapper/dtos/jobScrapper.dto";
import { ApplyDTO } from "../DTOs/apply.dto";

@Injectable()
export class ReedService {
    private readonly logger = new Logger(ReedService.name);

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        private readonly applicationService: CommonApplicationService
    ) {}

    private async getConfig(endpoint: string) {
        const apiKey = await this.configService.get("api.ReedApiKey");
        const apiUrl = `${await this.configService.get(
            "api.ReedBaseUrl"
        )}/${endpoint}`;
        return { apiKey, apiUrl };
    }

    async signup(data: any, file: any) {
        const apiKey = await this.configService.get("api.ReedApiKey");
        const apiUrl = `${await this.configService.get(
            "api.ReedBaseUrl"
        )}/signup`;

        const fileBlob = new Blob([file.buffer], { type: file.mimetype });
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", process.env.REED_USER_PASSWORD);
        formData.append("forename", data.firstName);
        formData.append("lastname", data.lastName);
        formData.append("postal_code", data.postcode);

        formData.append("previous_job", data.desiredJob);
        formData.append("desired_job", data.desiredJob);
        formData.append("contact_number", data.phone);
        formData.append("work_location", data.county);
        formData.append("city", data.town);
        formData.append("country", process.env.GENERAL_COUNTRY);
        formData.append("minimum_salary", data.desiredMinSalary.toString());
        formData.append("api", apiKey);
        formData.append("cv_resume", fileBlob, file.originalname);

        const config = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        console.log(`Calling reed api signup`, apiUrl, formData);

        try {
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                `Response from Reed Api Signup: `,
                apiUrl,
                response.status,
                response.data
            );
        } catch (err) {
            console.error(
                `Reed signup error: `,
                err.response?.status,
                err.response?.data ?? err
            );
            throw new BadRequestException(
                `Failed to signup for Reed ${err.response?.data?.error ? "Because: " + err.response?.data?.error : ""}`
            );
        }
    }

    async updateCV(email: string, file: any) {
        const apiKey = await this.configService.get("api.ReedApiKey");
        const apiUrl = `${await this.configService.get(
            "api.ReedBaseUrl"
        )}/update_cv`;

        const config = {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        };

        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        const formData = new FormData();

        formData.append("password", process.env.REED_USER_PASSWORD);
        formData.append("email", email);
        formData.append("api", apiKey);
        formData.append("resume", fileBlob, file.originalname);

        try {
            console.log("Calling Reed Api for CV Update", apiUrl, formData);
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Cv updated successfully on Reed",
                apiUrl,
                formData,
                response.status,
                response.data
            );
        } catch (err) {
            console.error(
                "Failed to update cv on Reed",
                apiUrl,
                formData,
                err.response?.status,
                err.response?.data
            );
            throw new BadRequestException("Failed to update cv on Reed.");
        }
    }

    async scrapJobs(userId: number, scrapJobsDto: JobScrapperDto) {
        const apiKey = await this.configService.get("api.ReedApiKey");
        const apiUrl = `${await this.configService.get(
            "api.ReedBaseUrl"
        )}/jobs_detail`;

        const config = {
            headers: {
                accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const formData = new FormData();
        formData.append("keyword", scrapJobsDto.searchTitle);
        formData.append("userId", userId.toString());
        formData.append("location", scrapJobsDto.location);
        formData.append("api", apiKey);
        formData.append("page", "2");

        let response;

        try {
            console.log("Calling Reed job scraping", apiUrl, formData);
            response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Response from job scraping on Reed",
                apiUrl,
                formData,
                response.data
            );
        } catch (err) {
            console.error(
                `Failed to scraping jobs on Reed Api`,
                apiUrl,
                formData,
                err.response?.status,
                JSON.stringify(err.response?.data)
            );
            throw new BadRequestException("Failed to scraping jobs from Reed.");
        }

        /*
        {
      "searchTitle": "software engineer",
      "jobUrl": "https://www.reed.co.uk/jobs/software-engineer/52641918",
      "jobTitle": "Software Engineer ",
      "locationName": "London",
      "minimumSalary": 75000,
      "maximumSalary": 75000,
      "jobDescription": " <p>We now have an exciting opportunity for an energetic and driven Software Engineer to help us deliver our award-winning products and services to our clients. This role will suit people who consider themselves a full-stack developer, who are excited by technology  and love pushing the boundaries of what's possible. We build straightforward solutions which aim to delight users, ensuring the best outcomes for our customers.</p> <p>This is a challenging role involving a high level of attention to detail but also allows a great deal of flexibility on achieving the right result using the best technology for a given situation. This is a great opportunity for someone who is looking for  a fast-paced environment which is varied and rewarding and allows them to be recognised for their efforts.<br /><br />You will be part of a cross-functional Agile team, working closely with the business, delivering our product backlog whilst also driving the team forward. You will be seen as a role model in the team, having proven experience in delivery of enterprise projects  to agreed timescales. Ability to mentor junior members of the team is highly beneficial. Having a track record of continual improvements and pushing for excellence is a must.</p> <p>You will have:</p> <ul> <li>Strong analytical and problem-solving skills.</li><li>Growth mindset.</li><li>Ability to identify and implement continual improvement.</li><li>Strong experience in developing services and APIs using a combination of one of the following Node, PHP, .NET or React.</li><li>Strong knowledge of MVC and other design patterns.</li><li>Strong knowledge of relational and NoSQL databases.</li><li>Secure development practices.</li><li>Extensible experience of API architecture design and development.</li><li>Demonstrable knowledge of SOLID principles</li><li>Knowledge of CI/CD automation systems such as Jenkins, codepipline.</li><li>Experience architecting systems from ground zero.</li><li>Experience working in an Agile and results driven environment.</li><li>Experience with containerisation.</li><li>Experience using React.</li><li>Using a git-based source control system.</li><li>Excellent communication and documentation skills.</li><li>Planning, organisation, and time management skills.</li><li>Experience working with Messaging systems e.g. SQS, SNS.</li><li>Experience developing AWS Lambda.</li><li>Experience with NextJS &amp; NestJS frameworks.</li><li>Working knowledge of domain-driven design.</li><li>ECS and container orchestration tools.</li><li>AWS cloud experience or certifications. </li><li>Previous experience working in e-commerce, banking and/or financial services.</li></ul> <p>About us:</p> <p>AJ Bell is one of the fastest-growing investment platform businesses in the UK offering an award-winning range of solutions that caters for everyone, from professional financial advisers, to DIY investors with little to no experience. We have over 503,000  customers using our award-winning platform propositions to manage assets totalling more than &#163;80.3 billion. Our customers trust us with their investments, and by continuously striving to make investing easier, we aim to help even more people take control of  their financial futures.</p> <p>Having listed on the Main Market of the London Stock Exchange in December 2018, AJ Bell is now a FTSE 250 company.</p> <p>Headquartered in Manchester with offices in central London and Bristol, we now have over 1300 employees and have been named one of the UK's 'Best 100 Companies to Work For’ for six consecutive years.</p> <p>There are opportunities for growth and professional development for employees wanting to progress within their career including induction training and our study support scheme which is part of our benefits package.</p> <p>There is an active programme of social events throughout the year, which are open to all employees. </p> <p>What we offer:</p> <ul> <li>Generous holiday allowance of 25 days, increasing up to 31 days with service, plus bank holidays</li><li>Holiday buy/sell scheme</li><li>Hybrid working policy</li><li>Casual dress code</li><li>Discretionary bi-annual bonus</li><li>Contributory pension scheme</li><li>Buy as you earn share scheme</li><li>Free shares scheme</li><li>Paid study support for qualifications</li><li>Enhanced maternity/paternity scheme from day one</li><li>Bike loan</li><li>Season ticket loan portal</li><li>Discounted PMI and Dental</li><li>Free gym</li><li>Paid volunteering opportunities</li><li>Free social events and more</li></ul> <p>AJ Bell is committed to providing an environment of mutual respect where equal employment opportunities are available to all applicants and all employees are empowered to bring their whole self to work.</p> <p>We do not discriminate on the basis of race, sex, gender identity, sexual orientation, age, pregnancy, religion, physical and mental disability, marital status and any other characteristics protected by the Equality Act 2010. All decisions to hire are based  on qualifications, merit and business need.</p> ",
      "shortJobDescription": "We now have an exciting opportunity for an energetic and driven Software Engineer to help us deliver our award-winning products and services to our clients. This role will suit people who consider themselves a full-stack developer, who are excited by technology and love pushing the boundaries of what's possible. We build straightforward solutions which aim to delight users, ensuring the best outcomes for our customers. This is a challenging role... ",
      "ContractType": "Permanent",
      "SalaryType": "per annum",
      "JobType": "Full Time",
      "jobId": 52641918,
      "updatedAt": "13/05/2024",
      "createdAt": "13/05/2024",
      "expirationDate": "24/06/2024",
      "userId": 3147861734671,
      "pageNbr": 1,
      "job_type": "",
      "employerName": "AJ Bell",
      "currency": "GBP",
      "textSalary": 75000,
      "period": "",
      "sector": "SOFTWARE ENGINEER"
    },
         */

        return response.data?.payload;
    }

    async applyJobs(applyForm: ApplyDTO) {
        const { apiKey, apiUrl } = await this.getConfig("apply_specific_job");

        const config = {
            headers: {
                accept: "application/json",
                "Content-Type": "application/json" // Set the content type to JSON
            }
        };

        const requestBody = {
            urls: applyForm.urls, // Assuming applyForm.urls is an array of URLs
            email: applyForm.email,
            password: process.env.CV_LIBRARY_USER_PASSWORD,
            userId: applyForm.userId,
            api: apiKey
        };

        try {
            console.log("Calling Reed job apply", apiUrl, requestBody);
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            console.log(
                "Response from job apply on Reed",
                apiUrl,
                requestBody,
                response.data
            );
            return response.data;
        } catch (err) {
            console.error(
                `Failed to apply jobs on Reed Api`,
                apiUrl,
                err.response?.status,
                requestBody,
                JSON.stringify(err.response?.data) ?? err
            );
            throw new BadRequestException(
                "Failed to apply jobs from Reed."
            );
        }
    }

    async scrapAndApplyJobs(applyForm: ApplyFormDto) {
        const apiKey = await this.configService.get("api.ReedApiKey");
        const apiUrl = `${await this.configService.get(
            "api.ReedBaseUrl"
        )}/scrape_apply`;
        const config = {
            headers: {
                accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const formData = new FormData();

        formData.append("email", applyForm.email);
        formData.append("userId", applyForm.userId.toString());
        formData.append("password", process.env.REED_USER_PASSWORD);
        formData.append("keyword", applyForm.jobTitles[0]);
        formData.append("location", applyForm.county);
        formData.append("page", process.env.APPLY_JOBS_PAGE_SIZE);
        formData.append("api", apiKey);

        let response;

        try {
            console.log("Calling Reed job apply", apiUrl, formData);
            response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Response from job apply on Reed",
                apiUrl,
                formData,
                response.data
            );
        } catch (err) {
            console.error(
                `Failed to apply jobs on Reed Api`,
                apiUrl,
                formData,
                err.response?.status,
                err.response?.data
            );
            throw new BadRequestException("Failed to source jobs from Reed.");
        }

        // save to database now
        await this.applicationService.saveApplication(
            applyForm,
            ScrapeSource.REED,
            response.data.payload.JobsApplied
        );
    }
}
