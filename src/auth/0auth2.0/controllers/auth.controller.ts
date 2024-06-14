import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UploadedFile,
    UseInterceptors,
    Get,
    UseGuards,
    Req,
    Param,
    Query,
    UnauthorizedException
} from "@nestjs/common";

import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from "@nestjs/swagger";
import { Request } from "express";
import {
    LogInDTO,
    SignupWithoutCVDto,
    ResetPasswordDTO,
    SimplySignupDTO,
    AdminGetUsersQuery
} from "../DTOs";
import { AuthService } from "../services/auth.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiResponse, ApiResponseWithPagination } from "src/globals/responses";
import { User } from "../entites/user.entity";
import { RoleGuard, JwtGuard } from "src/auth/0auth2.0/guards";
import { Role, Role as UserRoles } from "src/auth/0auth2.0/enums";
import { SignupResponse } from "../responses";
import { EmailSendingService } from "src/emails/services/email.service";
import { PaginationDTO } from "src/globals/DTOs";
import { AdminCreateDto } from "../DTOs/adminCreate.dto";
import * as process from "process";
import { ClientCreateDto } from "../DTOs/clientCreate.dto";
import { ForgotPasswordDto } from "../DTOs/forgotPassword.dto";
import { SignupWithCVInfoDto } from "../DTOs/signupWithCVInfo.dto";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("auth")
@Controller("auth")
@ApiBearerAuth()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private emailService: EmailSendingService
    ) {}

    @Post("signUpWithCV")
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
        description: "User registered successfully",
        type: ApiResponse<SignupResponse>
    })
    async uploadAndRegisterWithCV(@UploadedFile() file: Express.Multer.File) {
        return await this.authService.signUpWithCV(file);
    }

    @Post("fetchSignupInfoFromCv")
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
    async fetchSignupInfoFromCv(@UploadedFile() file: Express.Multer.File) {
        return await this.authService.fetchSignupInfoFromCv(file);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @Post("signupWithInfoFromCV")
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        type: SignupWithCVInfoDto
    })
    @ApiOkResponse({
        description: "User registered successfully",
        type: ApiResponse<SignupResponse>
    })
    async signupWithInfoFromCV(
        @Req() req: Request,
        @Body() signupWithCVInfoDto: SignupWithCVInfoDto
    ) {
        signupWithCVInfoDto.userId = req.user["sub"];
        return await this.authService.signupWithInfoFromCV(signupWithCVInfoDto);
    }

    @Post("signUpWithoutCV")
    @HttpCode(HttpStatus.OK)
    @ApiBody({
        description: "json object corresponding to SignupWithoutCVDto ",
        type: SignupWithoutCVDto
    })
    @ApiOkResponse({
        description: "User registered successfully",
        type: ApiResponse<SignupResponse>
    })
    async registerWithoutCV(@Body() signupWithoutCVDto: SignupWithoutCVDto) {
        return await this.authService.signUpWithoutCV(signupWithoutCVDto);
    }

    @Post("simplySignup")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Signup Simply with even less info" })
    @ApiBody({
        description: "json object corresponding to SimplySignup",
        type: SimplySignupDTO
    })
    @ApiOkResponse({
        description: "User registered successfully",
        type: ApiResponse<SignupResponse>
    })
    async simplyRegister(@Body() simplySignupDTO: SimplySignupDTO) {
        return await this.authService.simplyRegister(simplySignupDTO);
    }

    @Post("intraSimplySignup")
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
    async intraSimplySignup(@Body() simplySignupDTO: ClientCreateDto) {
        return await this.authService.intraSimplyRegister(simplySignupDTO);
    }

    @Post("/signin")
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: "User logs in / authenticated with access"
    })
    @ApiOperation({ summary: "login using email and password" })
    async logIn(@Body() loginDTO: LogInDTO) {
        return await this.authService.logIn(loginDTO);
    }

    @Post("/sendEmail")
    @ApiOkResponse({
        description: "Email sent successfully"
    })
    @ApiOperation({ summary: "Send an email" })
    async sendEmail() {
        try {
            await this.emailService.sendTestEmail();
            return { message: "Email sent successfully" };
        } catch (error) {
            return { message: "Failed to send email" };
        }
    }

    @Post("setPassword")
    async setPassword(@Body() newPasswordDto: ResetPasswordDTO) {
        return this.authService.setUserPassword(
            newPasswordDto.token,
            newPasswordDto.password
        );
    }

    @Get("getIntraAdmin")
    @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Get Intra Admin Api Token" })
    @ApiOkResponse({
        description: "User registered successfully",
        type: ApiResponse<{ token: string }>
    })
    async getIntraAdmin() {
        return await this.authService.getIntraAdmin();
    }

    @Get("verify-email-change")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Verify Email Address" })
    @ApiOkResponse({
        description: "Email Address Verified successfully."
    })
    async verifyEmail(@Query() query: { code: string }) {
        return await this.authService.verifyEmailAddress(query.code);
    }

    @Post("createAdmin")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Create Admin" })
    @ApiOkResponse({
        description: "Admin created",
        type: ApiResponse<{ token: string }>
    })
    async createAdmin(@Body() reqBody: AdminCreateDto) {
        if (reqBody.token !== process.env.CLIENT_CRM_BACKEND_SUPER_TOKEN) {
            throw new UnauthorizedException(
                "You don't have permission to this."
            );
        }
        return await this.authService.createAdmin(reqBody);
    }

    @Get("fetchUserProfile")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN, Role.CLIENT))
    async fetchUserProfileFromDB(@Req() req: Request) {
        const user = this.authService.fetchUserById(req.user["sub"]);
        this.authService.sendFetchuserprofileSocketEvent(user);
        return user;
    }

    @Get("adminFetchUsers")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    @ApiOkResponse({
        description: "Get User's Successful",
        type: ApiResponseWithPagination<User[]>
    })
    async adminFetchUsers(
        @Query() pagination: PaginationDTO,
        @Query() query: AdminGetUsersQuery
    ) {
        return this.authService.adminFetchUsers(pagination, query);
    }

    @Get("adminFetchUserProfile/:userId")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async adminFetchUserProfileFromDB(@Param("userId") userId: string) {
        return this.authService.fetchUserByIdForIntraCrm(userId);
    }

    @Post("forgot-password")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "forgot password" })
    @ApiOkResponse({
        description: "Email Send successfully",
        type: ApiResponse<{ message: string }>
    })
    async forgotPassword(@Body() reqBody: ForgotPasswordDto) {
        return await this.authService.sendPasswordResetEmail(reqBody.email);
    }

    @Post("reset-password")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "forgot password" })
    @ApiOkResponse({
        description: "Reset password successfully",
        type: ApiResponse<{ message: string }>
    })
    async resetPassword(@Body() body: ResetPasswordDTO) {
        return await this.authService.resetPassword(body.token, body.password);
    }
}
