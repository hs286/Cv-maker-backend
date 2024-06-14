import { EmailSendingService } from "../services/email.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
    ConflictException,
    Controller,
    Post,
    Req,
    UseGuards
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../../auth/0auth2.0/services/auth.service";
import { Request } from "express";

@ApiTags("Emails")
@Controller("emails")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class EmailController {
    constructor(
        private readonly emailSenderService: EmailSendingService,
        private readonly authService: AuthService
    ) {}

    @Post("/send-booking-call")
    async sendBookingEmailToAdmin(@Req() req: Request) {
        // TODO: get user info by userId -> req.user['sub']
        const userId = req.user["sub"];
        const user = await this.authService.fetchUserById(userId);
        if (
            user.bookedAt &&
            user.bookedAt.getTime() + 24 * 60 * 60 * 1000 > new Date().getTime()
        ) {
            throw new ConflictException(
                "You have already booked a call in last 24h"
            );
        }
        this.authService.updateLastCallBookDate(userId);

        this.emailSenderService.sendBookingEmailToAdmin(
            user.email,
            `${user.firstName.charAt(0).toUpperCase()}${user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase()}${user.lastName.slice(1)}`,
            user.phone
        );

        // send email to booking user
        this.emailSenderService.sendBookingEmailToBooker(
            user.email,
            `${user.firstName.charAt(0).toUpperCase()}${user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase()}${user.lastName.slice(1)}`,
            user.phone
        );
    }
}
