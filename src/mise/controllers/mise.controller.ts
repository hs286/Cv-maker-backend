import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { MiseService } from "../services/mise.service";
import { JobCreateFormDto } from "../DTOs/jobCreateForm.dto";
import { LocationQueryDto } from "../DTOs/locationQuery.dto";
import { JobRoleQueryDto } from "../DTOs/jobRoleQuery.dto";
import { JobSectorQueryDto } from "../DTOs/jobSectorQuery.dto";

@ApiTags("mise")
@Controller("mise")
export class MiseController {
    constructor(private readonly miseService: MiseService) {
    }

    @ApiOperation({
        description: "The Get Jobs API allows you to retrieve a list of jobs."
    })
    @Get("/jobs/is-unique")
    async isJobTitleUnique(
        @Query("title") title: string,
        @Query("type") type: number
    ) {
        return await this.miseService.isJobUnique({ title, type });
    }

    @ApiOperation({
        description: "The Get Jobs API allows you to retrieve a list of jobs."
    })
    @Get("/jobs")
    async getJobs(@Query() getJobRolesDto: JobRoleQueryDto) {
        return await this.miseService.getJobs(getJobRolesDto);
    }

    @Post("/jobs")
    async addJob(@Body() fromData: JobCreateFormDto) {
        return this.miseService.addJob(fromData);
    }

    // @ApiOperation({
    //     description:
    //         "The Get Sectors API allows you to retrieve a list of sectors."
    // })
    // @Get("/sectors")
    // async getSectors(@Query() jobSectorDto: JobSectorQueryDto) {
    //     return await this.miseService.getSectors(jobSectorDto);
    // }

    @ApiOperation({
        description:
            "The Get Sectors API allows you to retrieve a list of sectors."
    })
    @Get("/sectors")
    async banglaGetSectors() {
        return await this.miseService.banglaGetSectors();
    }

    @ApiOperation({
        description:
            "The Get locations API allows you to retrieve a list of sectors."
    })
    @Get("/locations")
    async getLocations(@Query() query: LocationQueryDto) {
        return await this.miseService.getLocations(query);
    }
}
