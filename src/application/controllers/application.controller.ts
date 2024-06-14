import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import {
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Body
} from "@nestjs/common";
import { ApplicationService } from "../services/application.service";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApplyFormDto } from "../DTOs/applyForm.dto";

@ApiTags("applicants")
@Controller("applicants")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}

    @Get("/")
    async getApplicants(
        @Query("search") search?: string,
        @Query("start") start = 0,
        @Query("length") length = 60
    ) {
        return this.applicationService.getApplications(search, start, length);
    }

    @Post("/")
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async saveApplicant(
        @Body() data: any,
        @UploadedFile() cv_document: Express.Multer.File
    ) {
        console.log(`Applicant Create POST`, data);
        return await this.applicationService.saveApplicant(data, cv_document);
    }

    @Put("/:userId")
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async updateCv(
        @Param("userId") userId: number,
        @Body()
        data: {
            email: string;
        },
        @UploadedFile() cv_document: Express.Multer.File
    ) {
        console.log(`Applicant Create POST`, userId);
        return await this.applicationService.updateCv(
            userId,
            data.email,
            cv_document
        );
    }

    @Get("/:userId")
    async getApplicantDetail(@Param("userId") userId: number) {
        console.log(`getApplicantDetail Controller`, userId);
        return await this.applicationService.getApplicantDetails(userId);
    }

    @Patch("/:userId")
    async updateApplicant(@Param("userId") userId: number, @Body() data: any) {
        console.log(`Applicant Update Controller`, userId, data);
        return await this.applicationService.updateApplicant(data, userId);
    }

    @Post("/apply")
    async applyJobs(@Body() applyForm: ApplyFormDto) {
        console.log(`Apply Jobs controller`, applyForm);
        return this.applicationService.applyJob(applyForm);
    }

    @Patch("/:userId/enable-auto-apply")
    async enableAutoApply(
        @Param("userId") userId: number,
        @Query("value") value: boolean
    ) {
        console.log(`enableAutoApply Controller`, userId, value);
        return await this.applicationService.toggleAutoApply(userId, value);
    }
}
