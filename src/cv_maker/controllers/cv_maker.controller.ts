// cv-maker.controller.ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";

import { Request } from "express";
import { CvMakerService } from "../services/cv_maker.service";
import { CreateCvMakerDto } from "../DTOs";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiTags
} from "@nestjs/swagger";
import { JwtGuard, RoleGuard } from "src/auth/0auth2.0/guards";
import { Role } from "src/auth/0auth2.0/enums";
import { FileInterceptor } from "@nestjs/platform-express";
import { CvMakerFile } from "../entities/cvMaker.entity";
import { CvMakerAdminUploadUserFileDTO } from "../DTOs/uploadCvMakerDto";

@ApiTags("CV Maker")
@Controller("cv-maker")
@ApiBearerAuth()
export class CvMakerController {
    constructor(private readonly cvMakerService: CvMakerService) {
    }

    @Post()
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async createOrUpdate(
        @Body() cvMakerDto: CreateCvMakerDto,
        @Query("isEdit") isEdit: boolean
    ) {
        if (isEdit) {
            const response = await this.cvMakerService.updateCommand(
                cvMakerDto.name,
                cvMakerDto.api_name,
                cvMakerDto.command,
                cvMakerDto.content
            );
            return response;
        } else {
            const response =
                await this.cvMakerService.createCvMaker(cvMakerDto);
            return response;
        }
    }

    @Delete(":api_name")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async remove(@Param("api_name") api_name: string) {
        console.log("delete admin Upload Cv Maker name is", api_name);
        const response = this.cvMakerService.deleteCvMaker(api_name);
        console.log("delete admin Upload Cv Maker response", response);

        return response;
    }

    @Get()
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async getAll() {
        const response = await this.cvMakerService.getAllCvMakers();
        return response;
    }

    @Post("adminUploadCvMakerFile")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        description: "Upload File by Admin/CV-Maker for user",
        schema: {
            type: "object",
            properties: {
                userId: {
                    type: "string",
                    description: "user id"
                },
                name: {
                    type: "string",
                    description: "name"
                },
                cvType: {
                    type: "string",
                    description: "Cv Type"
                },
                jobTarget: {
                    type: "string",
                    description: "job Target"
                },
                content: {
                    type: "string",
                    description: "content"
                },
                file: {
                    type: "string",
                    format: "binary"
                }
            }
        }
    })
    @ApiOkResponse({
        description: "File Created Successfully",
        type: CvMakerFile
    })
    async adminUploadCvMakerFile(
        @Req() req: Request,
        @Body() body: CvMakerAdminUploadUserFileDTO,
        @Query("save") save = false,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.cvMakerService.fetchInfoByCvMaker(
            req.user["role"],
            body,
            file,
            save
        );
    }
}
