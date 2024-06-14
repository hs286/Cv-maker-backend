import {
    Body,
    Controller,
    Post,
    Get,
    Delete,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Req,
    Param,
    Query,
    StreamableFile,
    ValidationPipe
} from "@nestjs/common";

import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { ApiResponse } from "src/globals/responses";
import { Role as UserRoles } from "src/auth/0auth2.0/enums";
import { RoleGuard, JwtGuard } from "src/auth/0auth2.0/guards";
import { FilesService } from "../services/files.service";
import { File } from "../entities/file.entity";
import { AdminUploadUserFileDTO, GetFilesQueryDto } from "../DTOs";
import { UserIdQueryDto } from "../DTOs/userIdQuery.dto";

@ApiTags("Files")
@Controller("files")
@ApiBearerAuth()
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post("userUploadFile")
    @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        description: "Upload File by user",
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
        description: "File Created Successfully",
        type: ApiResponse<File>
    })
    async userUploadFile(
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.filesService.userUploadFile(req.user["sub"], file);
    }

    @Post("adminUploadUserFile")
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN, UserRoles.CV_SPECIALIST))
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        description: "Upload File by Admin/CV-Specialist for user",
        schema: {
            type: "object",
            properties: {
                userId: {
                    type: "string",
                    description: "user id"
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
        type: ApiResponse<File>
    })
    async adminUploadUserFile(
        @Req() req: Request,
        @Body() body: AdminUploadUserFileDTO,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.filesService.adminUploadUserFile(
            req.user["role"],
            body.userId,
            file
        );
    }

    @Get("userGetFiles")
    @ApiOperation({
        description: "User can get one all his uploaded files"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
    @ApiOkResponse({
        description: "Get Files Successfully",
        type: ApiResponse<File[]>
    })
    async userGetFiles(@Req() req: Request, @Query() query: GetFilesQueryDto) {
        return await this.filesService.getFiles(query, req.user["sub"]);
    }

    @Get("userGetFile/:fileId")
    @ApiOperation({
        description: "User can get one of his files by providing an id"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
    @ApiOkResponse({
        description: "Get File Successfully",
        type: ApiResponse<File>
    })
    async userGetFile(@Req() req: Request, @Param("fileId") fileId: string) {
        return await this.filesService.downloadFile(fileId, req.user["sub"]);
    }

    @Get("userDownloadFile/:fileId")
    @ApiOperation({
        description: "User can download one of his files by providing an id"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
    @ApiOkResponse({
        description: "Download File Successfully",
        type: StreamableFile
    })
    async userDownloadFile(
        @Req() req: Request,
        @Param("fileId") fileId: string
    ) {
        return await this.filesService.downloadFile(fileId, req.user["sub"]);
    }

    @Get("adminGetFiles")
    @ApiOperation({
        description: "Get all files for admin"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN, UserRoles.CV_SPECIALIST))
    @ApiOkResponse({
        description: "Get Files Successfully",
        type: ApiResponse<File[]>
    })
    async adminGetFiles(
        @Query(new ValidationPipe({ transform: true }))
        userIdDto: UserIdQueryDto, // Using UserIdQueryDto for userId validation
        @Query() query: GetFilesQueryDto
    ) {
        const { userId } = userIdDto; // Extracting userId from the DTO object
        return await this.filesService.getFiles(query, userId);
    }

    @Get("adminGetFile/:fileId")
    @ApiOperation({
        description: "Admin get one file by id"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN, UserRoles.CV_SPECIALIST))
    @ApiOkResponse({
        description: "Get File Successfully",
        type: ApiResponse<File>
    })
    async adminGetFile(@Param("fileId") fileId: string) {
        return await this.filesService.getFile(fileId);
    }

    @Get("userDownloadFile/:fileId")
    @ApiOperation({
        description: "Admin can download a file by providing an id"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
    @ApiOkResponse({
        description: "Download File Successfully",
        type: StreamableFile
    })
    async adminDownloadFile(
        @Req() req: Request,
        @Param("fileId") fileId: string
    ) {
        return await this.filesService.downloadFile(fileId);
    }

    @Delete("userDeleteFile/:fileId")
    @ApiOperation({
        description: "User delete his file by id"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
    @ApiOkResponse({
        description: "Get Files Successfully",
        type: ApiResponse<File[]>
    })
    async userDeleteFile(@Req() req: Request, @Param("fileId") fileId: string) {
        return await this.filesService.deleteFile(fileId, req.user["sub"]);
    }

    @Delete("adminDeleteFile/:fileId")
    @ApiOperation({
        description: "Admin delete one file by id"
    })
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN, UserRoles.CV_SPECIALIST))
    @ApiOkResponse({
        description: "Delete File Successfully",
        type: ApiResponse<File>
    })
    async adminDeleteFile(@Param("fileId") fileId: string) {
        return await this.filesService.deleteFile(fileId);
    }
}
