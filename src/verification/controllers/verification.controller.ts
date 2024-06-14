import { ApiBearerAuth, ApiBody, ApiTags } from "@nestjs/swagger";
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards
} from "@nestjs/common";
import { VerificationService } from "../services/verification.service";
import { SmsDTO } from "../DTOs/sms.dto";
import { OtpDTO } from "../DTOs/otp.dto";
import { Request } from "express";
import { AuthGuard } from "@nestjs/passport";

@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@ApiTags("Verification Controller")
@Controller("verification")
export class VerificationController {
    constructor(
        private readonly smsVerificationService: VerificationService
    ) {}

    @ApiBody({ type: SmsDTO })
    @Post("/sms/send")
    async sendSMS(@Body() formData: SmsDTO) {
        return this.smsVerificationService.sendSMS(
            formData.phone,
            formData.text
        );
    }

    @Get("/sms/send-otp/:phone")
    async sendSmsOTP(@Req() req: Request, @Param("phone") phone: string) {
        return this.smsVerificationService.sendSmsOTPCode(
            req.user["sub"],
            phone
        );
    }

    @ApiBody({ type: OtpDTO })
    @Post("/sms/otp-verify")
    async verifySMSOTP(@Req() req: Request, @Body() form: OtpDTO) {
        return this.smsVerificationService.verifySmsOTP(
            req.user["sub"],
            form
        );
    }

    @Get("/email/send-otp/:email")
    async sendEmailOTP(@Req() req: Request, @Param("email") email: string) {
        return this.smsVerificationService.sendEmailOTPCode(
            req.user["sub"],
            email
        );
    }

    @ApiBody({ type: OtpDTO })
    @Post("/email/otp-verify")
    async verifyEmailOTP(@Req() req: Request, @Body() form: OtpDTO) {
        return this.smsVerificationService.verifyEmailOTP(
            req.user["sub"],
            form
        );
    }
}
