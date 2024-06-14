import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    UseGuards,
    Query,
    ParseIntPipe,
    DefaultValuePipe
} from "@nestjs/common";
import {
    ApiTags,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiBody
} from "@nestjs/swagger";
import { JobScrapperService } from "../services/jobScrapper.service";
import { JobScrapperDto } from "../dtos/jobScrapper.dto"; // Use the correct DTO
import { ScrappedJobEntity } from "../entities/jobScrapper.entity";
import { Request } from "express";
import { AuthGuard } from "@nestjs/passport";
import { ApplyDTO } from "../../thirdPartyApi/DTOs/apply.dto";

@ApiTags("Job Fetch")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("fetch-jobs") // The base route for this controller
export class JobScrapperController {
    constructor(private readonly jobScrapperService: JobScrapperService) {
    }

    @ApiResponse({
        status: 200,
        description: "Successfully fetched jobs.",
        type: ScrappedJobEntity
    })
    @Post("fetchJobsFromApi")
    async fetchJobsFromCVLibrary(
        @Req() req: Request,
        @Body() scrapJobsDto: JobScrapperDto
    ) {
        // Execute both functions and return the response from the one that completes first
        const jobsResponse = await Promise.race([
            this.jobScrapperService.fetchJobsFromCVLibrary(
                req.user["sub"],
                scrapJobsDto
            ),
            this.jobScrapperService.fetchJobsFromReed(
                req.user["sub"],
                scrapJobsDto
            )
        ]);

        return jobsResponse;
    }

    @ApiBody({
        description: "Apply",
        type: ApplyDTO
    })
    @Post("apply")
    async jobApply(@Req() req: Request, @Body() data: ApplyDTO) {
        return this.jobScrapperService.apply(req.user["sub"], data);
    }

    // GET /JOB_DESCRIPTION FROM ATS APIS.
    @Post("ATSstatsWithJobDescription")
    @ApiBearerAuth()
    @ApiResponse({
        status: 200,
        description: "Successfully fetched ATS stats."
    })
    @ApiResponse({ status: 500, description: "Internal server error." })
    async postATSstatsWithJobDescription(@Req() req: Request) {
        return this.jobScrapperService.postATSstatsWithJobDescription(
            req.user["sub"]
        );
    }

    // Function to return all jobs from DB
    @Get("fetchAllJobs")
    @ApiBearerAuth()
    @ApiQuery({ name: "page", type: Number }) // use this decorator for the page parameter
    @ApiQuery({ name: "limit", type: Number }) // use this decorator for the limit parameter
    @ApiQuery({ name: "targetJob", type: String, required: false }) // use this decorator for the optional targetJob parameter
    @ApiQuery({ name: "location", type: String, required: false }) // use this decorator for the optional location parameter
    @ApiQuery({ name: "isApplied", type: Boolean, required: false }) // use this decorator for the optional location parameter
    @ApiQuery({ name: "salaryRange", type: String, required: false }) // use this decorator for the optional location parameter
    @ApiQuery({ name: "jobType", type: String, required: false }) // use this decorator for the optional location parameter
    @ApiQuery({ name: "orderBySalary", type: String, required: false }) // use this decorator for the optional location parameter
    @ApiResponse({
        status: 200,
        description: "Successfully fetch jobs for a particular user"
    })
    @ApiResponse({ status: 500, description: "Internal server error." })
    async fetchAllJobsForUser(
        @Req() req: Request,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1, // add this query parameter
        @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10, // add this query parameter
        @Query("targetJob") targetJob?: string,
        @Query("location") location?: string,
        @Query("isApplied") isApplied?: boolean,
        @Query("salaryRange") salaryRange?: string,
        @Query("jobType") jobType?: string,
        @Query("orderBySalary") orderBySalary?: "ASC" | "DESC"
    ) {
        limit = limit > 100 ? 100 : limit; // limit the maximum number of items per page
        return this.jobScrapperService.fetchJobsForUser({
            userId: req.user["sub"],
            page,
            limit,
            targetJob,
            location,
            isApplied,
            salaryRange,
            jobType,
            orderBySalary
        }); // pass the options to the service method
    }
}
