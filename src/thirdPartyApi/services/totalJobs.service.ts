import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { CommonApplicationService } from "./commonApplication.service";
import { firstValueFrom } from "rxjs";
import * as process from "process";
import { ApplyFormDto } from "../../application/DTOs/applyForm.dto";
import { ScrapeSource } from "../../auth/0auth2.0/enums";

@Injectable()
export class TotalJobsService {
  private readonly logger = new Logger(TotalJobsService.name);
  constructor(
    private readonly applicationService: CommonApplicationService,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
  }

  async signup(data: any, file: any) {
    const apiKey = await this.configService.get("api.TotalJobsApiKey");
    const apiUrl = `${await this.configService.get(
      "api.TotalJobsBaseUrl"
    )}/signup`;

    const fileBlob = new Blob([file.buffer], { type: file.mimetype });
    const formData = new FormData();
    formData.append("first_name", data.firstName);
    formData.append("last_name", data.lastName);
    formData.append("signup_email", data.email);
    formData.append("resume", fileBlob, file.originalname);
    formData.append("job_title", data.desiredJob);
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-API-KEY": apiKey
      }
    };
    console.log(`Calling total jobs api signup`, apiUrl, formData);
    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, formData, config)
      );
      console.log(`Response from Total Jobs Api Signup: `, apiUrl, response.data);
    } catch (err) {
      console.error(`Total Jobs signup error: `, err.response?.status, err.response?.data);
      throw new BadRequestException(`Failed to signup for Total Jobs Api.`);
    }

  }

  async updateCV(email: string, file: any) {
    const apiKey = await this.configService.get("api.TotalJobsApiKey");
    const apiUrl = `${await this.configService.get(
      "api.TotalJobsBaseUrl"
    )}/replace_resume`;

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-API-KEY": apiKey
      }
    };

    const fileBlob = new Blob([file.buffer], { type: file.mimetype });

    const formData = new FormData();

    formData.append("password", process.env.TOTAL_JOBS_USER_PASSWORD);
    formData.append("email", email);
    formData.append("resume", fileBlob, file.originalname);


    try {
      console.log("Calling Total Jobs Api for CV Update", apiUrl, formData);
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, formData, config)
      );
      console.log("Cv updated successfully on Total Jobs", apiUrl, formData, response.status, response.data);
    } catch (err) {
      console.error("Failed to update cv on Total Jobs", apiUrl, formData, err.response?.status, err.response?.data);
      throw new BadRequestException("Failed to update cv on Total Jobs.");
    }

  }

  async scrapAndApplyJobs(applyForm: ApplyFormDto) {
    const apiKey = await this.configService.get("api.TotalJobsApiKey");
    const apiUrl = `${await this.configService.get(
      "api.TotalJobsBaseUrl"
    )}/login_scrape_apply`;
    const config = {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-API-KEY": apiKey
      }
    };

    const formData = new FormData();

    formData.append("email", applyForm.email);
    formData.append("password", process.env.TOTAL_JOBS_USER_PASSWORD);
    formData.append("job_title", applyForm.jobTitles[0]);
    formData.append("location", applyForm.county);
    formData.append("pages", process.env.APPLY_JOBS_PAGE_SIZE);

    let response;

    try {
      console.log("Calling Total Jobs job apply", apiUrl, formData);
      response = await firstValueFrom(
        this.httpService.post(apiUrl, formData, config)
      );
      console.log("Response from job apply on Total Jobs", apiUrl, formData, response.data);
    } catch (err) {
      console.error(`Failed to apply jobs on Total Jobs Api`, apiUrl, formData, err.response?.status, err.response?.data);
      throw new BadRequestException("Failed to apply job on Total Jobs.");
    }

    // save to database now
    await this.applicationService.saveApplication(applyForm, ScrapeSource.TOTAL_JOBS, response.data.JobsApplied);

  }
}