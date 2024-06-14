/* eslint-disable prettier/prettier */
import { InjectRepository } from "@nestjs/typeorm";
import {
    In,
    LessThanOrEqual,
    Like,
    MoreThanOrEqual,
    Repository
} from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { ScrappedJobEntity } from "../entities/jobScrapper.entity";
import { AuthService } from "src/auth/0auth2.0/services/auth.service";
import { NotFoundException } from "@nestjs/common";
import { JobScrapperDto } from "../dtos/jobScrapper.dto";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { LogService } from "src/logger";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { CvLibService } from "../../thirdPartyApi/services/cvLib.service";
import { ApplyDTO } from "../../thirdPartyApi/DTOs/apply.dto";
import { ReedService } from "../../thirdPartyApi/services/reed.service";
import { ThirdPartyApi } from "../../thirdPartyApi/enums/enum";
import { WebSocketGate } from "src/websocket/websocket.gateway";
import { EmailSendingService } from "src/emails/services/email.service";

@Injectable()
export class JobScrapperService {
    constructor(
        @InjectRepository(ScrappedJobEntity)
        public jobScrapperRepository: Repository<ScrappedJobEntity>,
        @InjectRepository(CVProfile)
        public cvProfileRepository: Repository<CVProfile>,
        @InjectRepository(User)
        public userRepository: Repository<User>,
        private authService: AuthService,
        private cvLibService: CvLibService,
        private reedService: ReedService,
        private httpService: HttpService,
        private configService: ConfigService,
        private logsService: LogService,
        private WebSocketGate: WebSocketGate,
        private emailService: EmailSendingService
    ) {}

    async fetchJobsFromCVLibrary(userId: string, scrapJobsDto: JobScrapperDto) {
        const user = await this.authService.fetchUserById(userId);

        if (!user) {
            throw new NotFoundException("No such user found");
        }

        if (!user.cvLibUserId) {
            user.cvLibUserId = new Date().getTime();
        }

        const jobScrapperResponse = await this.cvLibService.getJobsDetail({
            ...scrapJobsDto,
            userId: user.cvLibUserId
        });

        if (!jobScrapperResponse || !Array.isArray(jobScrapperResponse)) {
            return []; // Return an empty array if the response is not as expected
        }

        const jobsToSave = jobScrapperResponse.map((job: ScrappedJobEntity) => {
            const scrappedJob = new ScrappedJobEntity();
            Object.assign(scrappedJob, job);
            scrappedJob.userId = userId;
            scrappedJob.searchTitle = scrapJobsDto.searchTitle;
            scrappedJob.searchLocation = scrapJobsDto.location;
            scrappedJob.source = ThirdPartyApi.CV_LIBRARY;
            scrappedJob.keywordsScoreProcessing = true;
            return scrappedJob;
        });

        await this.saveScrappedJobs(jobsToSave);

        this.postATSstatsWithJobDescription(userId, ThirdPartyApi.CV_LIBRARY);

        return jobsToSave;
    }

    async fetchJobsFromReed(userId: string, scrapJobsDto: JobScrapperDto) {
        const user = await this.authService.fetchUserById(userId);
        if (!user) {
            throw new NotFoundException("No such user found");
        }

        if (!user.reedUserId) {
            user.reedUserId = new Date().getTime();
        }

        const jobScrapperResponse = await this.reedService.scrapJobs(
            user.reedUserId,
            scrapJobsDto
        );

        if (!jobScrapperResponse || !Array.isArray(jobScrapperResponse)) {
            return []; // Return an empty array if the response is not as expected
        }

        const jobsToSave = jobScrapperResponse.map((job: ScrappedJobEntity) => {
            const scrappedJob = new ScrappedJobEntity();
            Object.assign(scrappedJob, job);
            scrappedJob.userId = userId;
            scrappedJob.searchTitle = scrapJobsDto.searchTitle;
            scrappedJob.searchLocation = scrapJobsDto.location;
            scrappedJob.source = ThirdPartyApi.REED;
            scrappedJob.keywordsScoreProcessing = true;
            return scrappedJob;
        });

        await this.saveScrappedJobs(jobsToSave);

        // this.postATSstatsWithJobDescription(userId, ThirdPartyApi.REED);

        return jobsToSave;
    }

    private async saveScrappedJobs(jobs: ScrappedJobEntity[]) {
        const startTime = new Date().getTime();

        // Use bulk insertion with insert method
        // await this.jobScrapperRepository
        //     .createQueryBuilder()
        //     .insert()
        //     .into(ScrappedJobEntity)
        //     .values(jobsToSave)
        //     .orIgnore()
        //     .execute();

        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            const existingJob = await this.jobScrapperRepository.findOne({
                where: {
                    jobId: job.jobId,
                    userId: job.userId
                }
            });
            if (existingJob) {
                job.j_id = existingJob.j_id;
                await this.jobScrapperRepository.save(job);
                console.log(
                    `${i} -> Updated Job[${job.source}]: ${job.jobTitle} | JobId: ${job.jobId}`
                );
            } else {
                await this.jobScrapperRepository.save(job);
                console.log(
                    `${i} -> Added Job[${job.source}]: ${job.jobTitle} | JobId: ${job.jobId}`
                );
            }
        }

        console.log(
            `Total ${jobs.length} jobs [From ${jobs.length ? jobs[0].source : "Unknown"} ] saved in db. Time: ${(new Date().getTime() - startTime) / 1000}ms `
        );
    }

    async apply(userId: string, data: ApplyDTO) {
        const user: User = await this.authService.fetchUserById(userId);

        if (
            !user.cvLibEmail ||
            !user.cvLibUserId ||
            !user.reedEmail ||
            !user.reedUserId
        ) {
            const missing = [];
            let errorMsg = "Profile is not completed yet. ";

            if (!user.hasUploadedCV || !user.cvUrl) missing.push("'CV'");
            if (!user.firstName) missing.push("'First Name'");
            if (!user.lastName) missing.push("'Last Name'");
            if (!user.jobTarget1) missing.push("'Job Target'");
            if (!user.location) missing.push("'Location'");
            if (!user.currentSalary) missing.push("'Salary'");

            missing.forEach((ms, index) => {
                if (index === 0) errorMsg += ms;
                else if (index !== 0 && index === missing.length - 1)
                    errorMsg += " and " + ms;
                else errorMsg += ", " + ms;
            });

            errorMsg += `${errorMsg} ${missing.length > 1 ? "are" : "is"} missing.`;

            if (!missing.length)
                errorMsg =
                    "Your profile is being setup. It won't take more than couple of minutes.";

            throw new ForbiddenException(errorMsg);
        }

        // const cvLibUrls = [];
        // const reedUrls = [];

        if (!data.source) {
            const job = await this.jobScrapperRepository.findOne({
                where: {
                    jobUrl: data.urls[0]
                }
            });
            data.source = job?.source ?? ThirdPartyApi.CV_LIBRARY;
            data.jobTitle = job?.jobTitle;
            data.jobDescription = job?.jobDescription;
            data.jobLocation = job?.locationName;
            data.jobSalary = `£${job?.minimumSalary} - £${job?.maximumSalary}/${job.SalaryType ?? "Annum"}`;
            data.jobEmployer = job?.employerName;
            data.jobReference = job?.jobId;
            console.log("data.source", data?.source);
        }

        if (data.source === ThirdPartyApi.REED) {
            data.email = user.reedEmail;
            data.userId = user.reedUserId;
            await this.reedService.applyJobs(data);
            await this.updateUserAppliedJobs(userId, data.urls);
        } else if (data.source === ThirdPartyApi.CV_LIBRARY) {
            data.email = user.cvLibEmail;
            data.userId = user.cvLibUserId;
            await this.cvLibService.applyJobs(data);
            await this.updateUserAppliedJobs(userId, data.urls);
        }

        this.emailService.sendApplyJobEmail({
            email: user.email,
            fullName: user.firstName,
            jobTitle: data.jobTitle,
            jobLocation: data.jobLocation,
            jobSalary: data.jobSalary,
            jobEmployer: data.jobEmployer,
            jobReference: data.jobReference
        });
    }

    // todo: confirm it belongs to what module and then replace.
    async atsStatsFromJobDescription(userId: string) {
        // check if user has a cv profile stored as json response.
        const userCVProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });
        if (!userCVProfile) {
            throw new NotFoundException("No CV profile found for this user.");
        }
        const apiKey = `Basic ${await this.configService.get("api.ATSApiKey")}`;
        console.log("API-KEY", apiKey);
        const apiUrl = `${await this.configService.get("api.ATSBaseUrl")}/score`;

        const requestBody = {
            // entire cv as a json object parsed from json string.
            data: JSON.parse(userCVProfile?.CVProfileStringified),
            //  user id from database.
            user_id: userCVProfile?.user?.userId,
            // latest job title of the user
            job_title: userCVProfile?.user?.jobRoles[0]?.jobTitle
        };

        // console.log('OUTGOING', requestBody);

        const config = {
            headers: {
                Authorization: apiKey
                // 'Content-Type': 'multipart/form-data',
            }
            // timeout: 500000,
        };

        try {
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            //   console.dir(response?.data, { depth: null });

            // console.log('response in try block', response);

            const apiResponse = response?.data;

            // console.log('valuation Response', valuationResponse);
            //store the gotten scores in valuator repository

            // RESPONSE
            // [
            //   {
            //     "objects": {
            //       "user_id": "string", --> USER GENERATED
            //       "keywords_score": 0, --> ATS_SCORE.
            //       "grammar_score": 0 , ---> CV SCORE.
            //     },
            //     "error": {
            //       "msg": "string"
            //     }
            //   }
            // ]

            // assuming we get an array in response , judgin from documentation
            userCVProfile.user.valuator.keyWordScore =
                apiResponse?.objects?.keywords_score;
            userCVProfile.user.valuator.grammerScore =
                apiResponse?.objects?.grammar_score;
        } catch (error) {
            console.error("Failed to atsStatsFromJobDescription");
        }
    }

    async postATSstatsWithJobDescription(userId: string, source?: string) {
        // check if user has a cv profile stored as json response.
        const userCVProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });

        const where: any = {
            userId,
            keywordsScoreProcessing: true
        };

        if (source) {
            where.source = source;
        }

        // fetch all jobs needed to produce ATS stats for each.
        const jobs = await this.jobScrapperRepository.find({
            where
        });

        if (!jobs || jobs.length === 0) {
            throw new NotFoundException("No jobs found");
        }

        const apiKey = `Basic ${await this.configService.get("api.ATSApiKey")}`;
        const apiUrl = `${await this.configService.get("api.ATSBaseUrl")}/job_description`;

        const config = {
            headers: {
                Authorization: apiKey
            }
        };

        // Use Promise.all to make parallel API calls for each job
        const atsStatsPromises = jobs.map(async (job) => {
            const requestBody = {
                job_title: job.jobTitle,
                jd_id: job.jobId,
                job_description: job.jobDescription,
                cv: JSON.parse(userCVProfile?.CVProfileStringified)
            };

            try {
                console.log(
                    "Calling ATS for Job Description Score",
                    apiUrl,
                    requestBody
                );

                const response = await firstValueFrom(
                    this.httpService.post(apiUrl, requestBody, config)
                );

                if (
                    response.data.objects.keywords_score === null ||
                    response.data.objects.keywords_score === undefined
                ) {
                    console.warn("Setting keywordsScore to 0 ");
                    job.keywordsScore = "0"; // Set score to '0' if timeout occurs
                    job.keywordsScoreProcessing = false;
                } else {
                    const data = response.data.objects;
                    console.log("API's Data: ", data);
                    if (!data) {
                        console.warn(
                            "Could not get ATS for Job Description Score"
                        );
                    }

                    job.keywordsScore = data.keywords_score;
                    job.keywordsScoreProcessing = data.keywords_score
                        ? false
                        : true;
                    job.wordsMatch = JSON.stringify(data.words_matched);
                }

                await this.jobScrapperRepository.save(job);
                this.WebSocketGate.jobScoreProcessing(job);
            } catch (error) {
                console.error(
                    "Error processing ATS stats for job:",
                    apiUrl,
                    requestBody,
                    error.status,
                    error.response.data ?? JSON.stringify(error)
                );

                job.keywordsScore = "0"; // Set score to '0' if timeout occurs
                job.keywordsScoreProcessing = false;
                await this.jobScrapperRepository.save(job);
            }
        });

        // Wait for all ATS stats promises to resolve
        await Promise.all(atsStatsPromises);
    }

    /**
     * The function fetches jobs for a specific user from a job scrapper repository and returns them.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of a user. It is used to filter and retrieve jobs associated with that user from the
     * `jobScrapperRepository`.
     * @param {number} page - The `page` parameter is a number that represents the current page of the pagination.
     * @param {number} limit - The `limit` parameter is a number that represents the maximum number of items per page.
     * @param {string} targetJob - The `targetJob` parameter is a string that represents the job title in job.
     * @param {string} location - The `location` parameter is a string that represents the location of the job.
     * @param {boolean} isApplied - The `isApplied` parameter is a boolean that represents if the job is already applied or not.
     * @param salaryRange
     * @param jobType
     * @param orderBySalary
     * @returns The function fetchJobsForUser is returning either an object with the data and the count of the jobs that match the given
     * userId and pagination options, or null if no jobs are found.
     */
    async fetchJobsForUser({
        userId,
        page = 1,
        limit = 10,
        targetJob,
        location,
        isApplied,
        salaryRange,
        jobType,
        orderBySalary
    }: {
        userId: string;
        page: number;
        limit: number;
        targetJob?: string;
        location?: string;
        isApplied?: boolean;
        salaryRange?: string;
        jobType?: string;
        orderBySalary?: "ASC" | "DESC";
    }) {
        const whereClause: any = {
            userId
        };

        if (!targetJob && !location) {
            const lastSearchedJob = await this.jobScrapperRepository.findOne({
                where: whereClause,
                order: {
                    updatedDate: "DESC"
                },
                select: ["searchTitle", "searchLocation"]
            });

            targetJob = lastSearchedJob?.searchTitle;
            location = lastSearchedJob?.searchLocation;
        }

        if (targetJob) {
            whereClause.searchTitle = Like(`%${targetJob}%`);
        }

        if (location) {
            whereClause.searchLocation = Like(`%${location}%`);
        }

        if (isApplied !== undefined) {
            whereClause.isApplied = isApplied;
        }

        if (salaryRange !== undefined) {
            if (salaryRange.includes("Under")) {
                const [_, value] = salaryRange
                    .replace(",", "")
                    .replace(",", "")
                    .split("£")
                    .map((s) => s.trim());
                console.log(`Value: ${value}`);
                whereClause.minimumSalary = LessThanOrEqual(parseInt(value));
            } else if (salaryRange.includes("Over")) {
                const [_, value] = salaryRange
                    .replace(",", "")
                    .replace(",", "")
                    .split("£")
                    .map((s) => s.trim());
                console.log(`Value: ${value}`);
                whereClause.maximumSalary = MoreThanOrEqual(parseInt(value));
            } else {
                const [min, max] = salaryRange
                    .replace("£", "")
                    .replace("£", "")
                    .replace(",", "")
                    .replace(",", "")
                    .split("-")
                    .map((s) => s.trim());
                console.log(`Min: ${min} | Max: ${max}`);
                whereClause.minimumSalary = MoreThanOrEqual(parseInt(min));
                whereClause.maximumSalary = LessThanOrEqual(parseInt(max));
            }
        }

        if (jobType !== undefined) {
            whereClause.jobType = jobType;
        }

        const orders: any = {
            updatedDate: "DESC"
        };

        if (orderBySalary !== undefined) {
            orders.textSalary = orderBySalary;
        }

        const [result, total] = await this.jobScrapperRepository.findAndCount({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
            order: orders
        });

        return {
            data: result,
            count: total
        };
    }

    private async updateUserAppliedJobs(userId: string, jobsUrl: string[]) {
        const response = await this.jobScrapperRepository
            .createQueryBuilder()
            .update(ScrappedJobEntity)
            .where({ userId, jobUrl: In(jobsUrl) })
            .set({ isApplied: true })
            .execute();
        return response;
    }

    private async updateUserCVLibEmail(userId: string, email: string) {
        await this.userRepository.update({ userId }, { cvLibEmail: email });
    }
}
