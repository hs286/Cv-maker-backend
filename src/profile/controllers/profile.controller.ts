import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";

import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiTags
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ProfileService } from "../services/profile.service";
import { UpdateJobTargetsDto } from "../DTOs/updateJobTargets.dto";
import { ApiResponse } from "src/globals/responses";
import { Request, Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdatePersonalInfoDto } from "../DTOs/updatePersonalInfo.dto";
import {
    AwardDTO,
    CertificateDTO,
    EducationDTO,
    TrainingDTO,
    UserProfileUpdateDTO,
    VolunteeringDTO,
    WorkHistoryDTO
} from "../DTOs/updateProfile.dto";
import { JwtGuard, RoleGuard } from "../../auth/0auth2.0/guards";
import { Role } from "../../auth/0auth2.0/enums";
import { GetFilesQueryDto } from "../../files/DTOs";
import { UploadType } from "../../files/enums";

@ApiTags("profile")
@Controller("profile")
@ApiBearerAuth()
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {
    }

    @UseGuards(AuthGuard("jwt"))
    @Patch("jobTargets")
    @ApiBody({
        type: UpdateJobTargetsDto
    })
    @ApiOkResponse()
    async jobTargets(@Req() req: Request, @Body() dto: UpdateJobTargetsDto) {
        return await this.profileService.updateJobTargets(req.user["sub"], dto);
    }

    @UseGuards(AuthGuard("jwt"))
    @Post("generateProfileSummary")
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary"
                }
            }
        }
    })
    @ApiOkResponse({
        description: "profile summary generated successfully",
        type: ApiResponse
    })
    async fetchProfileSummary(
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.profileService.generateProfileSummary(
            req.user["sub"],
            file
        );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: UpdatePersonalInfoDto })
    @Patch("personalInfo")
    async personalInfo(
        @Req() req: Request,
        @Body() dto: UpdatePersonalInfoDto
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updatePersonalInfo(
                dto.userId,
                dto,
                Role.ADMIN
            );
        } else
            return await this.profileService.updatePersonalInfo(
                req.user["sub"],
                dto,
                Role.CLIENT
            );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [WorkHistoryDTO] })
    @Patch("workHistory")
    @ApiOkResponse()
    async workHistory(
        @Req() req: Request,
        @Body() dto: WorkHistoryDTO[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            const updatedWorkHistory =
                await this.profileService.updateWorkHistory(
                    clientInfo.userId,
                    dto
                );
            return { message: "updated successfully" };
        } else
            return await this.profileService.updateWorkHistory(
                req.user["sub"],
                dto
            );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [EducationDTO] })
    @Patch("educationHistory")
    @ApiOkResponse()
    async eductionHistory(
        @Req() req: Request,
        @Body() dto: EducationDTO[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updateEducationHistory(
                clientInfo.userId,
                dto
            );
        } else
            return await this.profileService.updateEducationHistory(
                req.user["sub"],
                dto
            );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [TrainingDTO] })
    @Patch("trainings")
    @ApiOkResponse()
    async trainings(
        @Req() req: Request,
        @Body() dto: TrainingDTO[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updateTrainings(
                clientInfo.userId,
                dto
            );
        } else
            return await this.profileService.updateTrainings(
                req.user["sub"],
                dto
            );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [CertificateDTO] })
    @Patch("certificates")
    @ApiOkResponse()
    async certificates(
        @Req() req: Request,
        @Body() dto: CertificateDTO[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updateCertificates(
                clientInfo.userId,
                dto
            );
        } else
            return await this.profileService.updateCertificates(
                req.user["sub"],
                dto
            );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [String] })
    @Patch("professionalSkills")
    @ApiOkResponse()
    async updateProfessionalSkills(
        @Req() req: Request,
        @Body() skills: string[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updateProfessionalSkills(
                clientInfo.userId,
                skills
            );
        } else
            return await this.profileService.updateProfessionalSkills(
                req.user["sub"],
                skills
            );
    }

    @ApiBody({ type: [String] })
    @ApiOkResponse()
    @Patch("technicalSkills")
    @UseGuards(AuthGuard("jwt"))
    async updateTechnicalSkills(
        @Req() req: Request,
        @Body() skills: string[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updateTechnicalSkills(
                clientInfo.userId,
                skills
            );
        } else
            return await this.profileService.updateTechnicalSkills(
                req.user["sub"],
                skills
            );
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [AwardDTO] })
    @Patch("awards")
    @ApiOkResponse()
    async awards(
        @Req() req: Request,
        @Body() dto: AwardDTO[],
        @Query() clientInfo: any
    ) {
        return await this.profileService.updateAwards(req.user["sub"], dto);
    }

    @UseGuards(AuthGuard("jwt"))
    @ApiBody({ type: [VolunteeringDTO] })
    @Patch("volunteering")
    @ApiOkResponse()
    async volunteering(
        @Req() req: Request,
        @Body() dto: VolunteeringDTO[],
        @Query() clientInfo: any
    ) {
        if (req.user["role"] === "admin") {
            return await this.profileService.updateVolunteering(
                clientInfo.userId,
                dto
            );
        } else
            return await this.profileService.updateVolunteering(
                req.user["sub"],
                dto
            );
    }

    @ApiBody({ type: UserProfileUpdateDTO })
    @Put("adminUpdateUserProfile/:userId")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async adminUpdateUserProfile(
        @Body() formData: UserProfileUpdateDTO,
        @Param("userId") userId: string,
        @Query("publish") publish: boolean
    ) {
        console.log("adminUpdateUserProfile", JSON.stringify(formData));
        return this.profileService.updateUserProfile(userId, formData, publish);
    }

    @ApiBody({ description: "bal" })
    @Post("cvs/generate")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async generateCVDraft(
        @Query("userId") userId: string,
        @Body() userData: any,
        @Res() res: Response
    ) {
        const buffer = await this.profileService.generateCv(userData);
        res.setHeader("Content-Disposition", "attachment; filename=cv.docx");
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.send(buffer);
    }

    @Get("cvs/generate/:userId")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async generateCV(@Param("userId") userId: string, @Res() res: Response) {
        const buffer = await this.profileService.generateCv(userId);
        res.setHeader("Content-Disposition", "attachment; filename=cv.docx");
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.send(buffer);
    }

    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary"
                }
            }
        }
    })
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    @Post("cvs/admin-upload/:userId")
    @UseInterceptors(FileInterceptor("file"))
    async adminUploadCV(
        @Param("userId") userId: string,
        @Query("type") type: UploadType,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.profileService.adminUploadCv(userId, file, type);
    }

    @Get("cvs/admin/:userId")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async getCVs(
        @Param("userId") userId: string,
        @Query() query: GetFilesQueryDto
    ) {
        return this.profileService.geCVs(query, userId);
    }

    @Delete("cvs/:fileId")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async deleteCV(@Param("fileId") fileId: string) {
        return this.profileService.deleteCV(fileId);
    }

    @Get("cvs/final/:fileId")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async finalCV(
        @Param("fileId") fileId: string,
        @Query("userId") userId: string
    ) {
        return this.profileService.finalCV(fileId, userId);
    }
}
