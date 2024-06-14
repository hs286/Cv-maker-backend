/* eslint-disable prettier/prettier */
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
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiTags,
    ApiOperation,
    ApiParam
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

import { GetAppliedJobDto, UpdateCredentialDto } from "../dto";
import { UserService } from "../service/user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtGuard, RoleGuard } from "src/auth/0auth2.0/guards";

import { Role as UserRoles } from "src/auth/0auth2.0/enums";

@ApiTags("user")
@Controller("user")
@ApiBearerAuth()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Delete(":userId")
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
    @ApiOperation({
        summary: "Admin permanently delete a all user data by user id"
    })
    @ApiParam({ name: "userId", description: "User Id" })
    async deleteFile(@Param("userId") userId: string) {
        const response =
            await this.userService.masterDeleteAllUserDataById(userId);
        return response;
    }

    @Post("/update-credentials")
    @UseGuards(AuthGuard("jwt"))
    async updateCredential(
        @Req() req: Request,
        @Body() updateCredentialDto: UpdateCredentialDto
    ) {
        return await this.userService.updateCredential(
            req.user["sub"],
            updateCredentialDto
        );
    }

    @Post("/update-profile-image")
    @UseGuards(AuthGuard("jwt"))
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        description: "Update Profile Picture",
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
    async updateProfileImage(
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.userService.updateProfileImage(req.user["sub"], file);
    }

    @Post("/update-cv")
    @UseGuards(AuthGuard("jwt"))
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        description: "Upload CV",
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
    async updateCV(
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.userService.updateCV(req.user["sub"], file);
    }

    @Get("/jobs/applied")
    async getAppliedJob(@Query() getAppliedJobDto: GetAppliedJobDto) {
        return await this.userService.getAppliedJob(getAppliedJobDto);
    }
}
