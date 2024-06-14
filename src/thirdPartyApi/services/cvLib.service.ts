import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { CommonApplicationService } from "./commonApplication.service";
import * as process from "process";
import { firstValueFrom } from "rxjs";
import { ApplyFormDto } from "../../application/DTOs/applyForm.dto";
import { ScrapeSource } from "../../auth/0auth2.0/enums";
import { ApplyDTO } from "../DTOs/apply.dto";

@Injectable()
export class CvLibService {
    private readonly logger = new Logger(CvLibService.name);

    constructor(
        private readonly applicationService: CommonApplicationService,
        private httpService: HttpService,
        private configService: ConfigService
    ) {}

    private async getConfig(endpoint: string) {
        const apiKey = await this.configService.get("api.JobScrapperApiKey");
        const apiUrl = `${await this.configService.get(
            "api.JobScrapperApiUrl"
        )}/${endpoint}`;
        return { apiKey, apiUrl };
    }

    async signup(data: any, file: any) {
        const { apiKey, apiUrl } = await this.getConfig("signup");

        const config = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const fileBlob = new Blob([file.buffer], { type: file.mimetype });
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("first_name", data.firstName);
        formData.append("last_name", data.lastName);
        formData.append("postcode", data.postcode);

        formData.append("current_job", data.desiredJob);
        formData.append("salary", "3");
        formData.append("job_type", "1");
        formData.append("contact", data.phone);
        formData.append("api", apiKey);
        formData.append("cv_resume", fileBlob, file.originalname);

        try {
            console.log(`Calling CV Library signup`, apiUrl, formData);
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                `Response from Cv Library Signup: `,
                apiUrl,
                response.status,
                response.data
            );
        } catch (error) {
            console.error(
                `Cv Library signup error: `,
                error.response?.status,
                error.response?.data
            );
            throw new BadRequestException(`Failed to signup for Cv Library.`);
        }
    }

    async updateCV(userId: number, email: string, file: any) {
        const { apiKey, apiUrl } = await this.getConfig("update_cv");

        const config = {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        };

        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        const formData = new FormData();

        formData.append("password", process.env.CV_LIBRARY_USER_PASSWORD);
        formData.append("email", email);
        formData.append("api", apiKey);
        formData.append("userId", userId.toString());
        formData.append("cv_resume", fileBlob, file.originalname);

        try {
            console.log(
                "Calling CV Library Api for CV Update",
                apiUrl,
                formData
            );
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Cv updated successfully on CV Library",
                apiUrl,
                formData,
                response.status,
                response.data
            );
        } catch (err) {
            console.error(
                "Failed to update cv on CV Library",
                apiUrl,
                formData,
                err.response?.status,
                err.response?.data
            );
            throw new BadRequestException("Failed to update cv on CV Library.");
        }
    }

    async getJobsDetail(data: any) {
        const { apiKey, apiUrl } = await this.getConfig("jobs_detail");

        const config = {
            headers: {
                accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const formData = new FormData();
        formData.append("keyword", data.searchTitle);
        formData.append("userId", data.userId);
        formData.append("location", data.location);
        formData.append("api", apiKey);
        formData.append("page", data.pages);

        // const formData = {
        //   keyword: data.searchTitle,
        //   userId: data.userId,
        //   location: data.location,
        //   api: apiKey,
        //   pages: data.pages
        // };

        try {
            console.log(
                "Calling Job Scrapper API [CV Lib] .....",
                apiUrl,
                formData
            );
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Response from Job Scrapper API [CV Lib]",
                apiUrl,
                formData,
                response.data
            );

            /*
             {
                "searchTitle": "Accountant",
                "jobUrl": "https://www.cv-library.co.uk/job/221439032/Accounts-Assistant",
                "jobTitle": "Accounts Assistant",
                "locationName": "Briston",
                "minimumSalary": "45000",
                "maximumSalary": "50000",
                "jobDescription": "Job Title: Accounts Assistant\nLocation: Dereham\nOur client, a dynamic and growing company based near Dereham, is seeking a dedicated and detail-oriented individual to join their team as an Accounts Assistant. This is an exciting opportunity for someone who is passionate about finance and eager to contribute to the success of a thriving business.\nKey Responsibilities:\nAssist with day-to-day accounting tasks including accounts receivable.\nPrepare and maintain financial records, ensuring accuracy and compliance with regulations.\nReconcile bank statements and assist with month-end closing procedures.\nAssist in the preparation of financial reports and analysis as required.\nSupport the finance team with ad hoc projects and tasks.\nRequirements:\nPrevious experience in an accounting or finance role.\nStrong attention to detail and ability to work accurately under pressure.\nExcellent communication skills and the ability to work well within a team.\nProficiency in Microsoft Excel and Sage 50 is advantageous.\nDriving licence.\nBenefits:\nCompetitive salary based on experience and qualifications.\nOpportunity for career development and progression within the company.\nA supportive and collaborative work environment.\nIf you are a motivated individual with a passion for finance and a desire to grow your career in a dynamic environment, we want to hear from you!",
                "jobId": "221439032",
                "updatedAt": "29/04/2024",
                "createdAt": "29/04/2024",
                "userId": 1714589437032,
                "pageNbr": 1,
                "job_type": "Permanent",
                "employerName": "BES Group",
                "currency": "GBP",
                "textSalary": "£45,000 - £50,000",
                "period": "annum",
                "sector": ""
              }
       */

            return response?.data?.payload;
        } catch (err) {
            console.error(
                `Failed to apply jobs on CV Library Api`,
                apiUrl,
                formData,
                err.response?.status,
                err.response?.data
            );
            throw new BadRequestException(
                "Failed to source jobs from CV Library."
            );
        }
    }

    async scrapAndApplyJobs(applyForm: ApplyFormDto) {
        const { apiKey, apiUrl } = await this.getConfig("scrape_apply");

        const config = {
            headers: {
                accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const formData = new FormData();

        formData.append("email", applyForm.email);
        formData.append("password", process.env.REED_USER_PASSWORD);
        formData.append("api", apiKey);
        formData.append("userId", applyForm.userId.toString());
        formData.append("keyword", applyForm.jobTitles[0]);
        formData.append("location", applyForm.county);
        formData.append("page", process.env.APPLY_JOBS_PAGE_SIZE);

        let response;

        try {
            console.log(
                "Calling CV Library scrap & apply job",
                apiUrl,
                formData
            );
            response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Response from scrap & apply job on CV Library",
                apiUrl,
                formData,
                response.data
            );
        } catch (err) {
            console.error(
                `Failed to scrap & apply job on CV Library Api`,
                apiUrl,
                formData,
                err.response?.status,
                err.response?.data
            );
            throw new BadRequestException(
                "Failed to source jobs from CV Library."
            );
        }

        // save to database now
        await this.applicationService.saveApplication(
            applyForm,
            ScrapeSource.CV_LIBRARY,
            response.data.jobsApplied
        );
    }

    async applyJobs(applyForm: ApplyDTO) {
        const { apiKey, apiUrl } = await this.getConfig("apply");

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
            console.log("Calling CV Library job apply", apiUrl, requestBody);
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            console.log(
                "Response from job apply on CV Library",
                apiUrl,
                requestBody,
                response.data
            );
            return response.data;
        } catch (err) {
            console.error(
                `Failed to apply jobs on CV Library Api`,
                apiUrl,
                err.response?.status,
                requestBody,
                JSON.stringify(err.response?.data) ?? err
            );
            throw new BadRequestException(
                "Failed to apply jobs from CV Library."
            );
        }
    }
}
