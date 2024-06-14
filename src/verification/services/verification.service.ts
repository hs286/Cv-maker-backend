import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { Vonage } from "@vonage/server-sdk";
import { Auth } from "@vonage/auth";
import { OTP } from "../entities/otp.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as process from "process";
import { TextMagicService } from "../../thirdPartyApi/services/textMagic.service";
import { EmailSendingService } from "../../emails/services/email.service";
import { User } from "../../auth/0auth2.0/entites/user.entity";
import { OtpDTO } from "../DTOs/otp.dto";
import { VerificationType } from "../enums";

@Injectable()
export class VerificationService {
    private vonage: Vonage;

    constructor(
        @InjectRepository(OTP)
        private otpRepository: Repository<OTP>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private emailService: EmailSendingService,
        private readonly textMagicService: TextMagicService
    ) {
        const credentials = new Auth({
            apiKey: process.env.VONAGE_API_KEY,
            apiSecret: process.env.VONAGE_API_SECRET
        });
        const options = {};
        this.vonage = new Vonage(credentials, options);
    }

    async sendSmsOTPCode(userId: string, phone: string): Promise<void> {
        const code = this.generateOTP();
        try {
            console.log(`Sending OTP code (${code}) to ${phone}`);
            await this.textMagicService.sendSMS(
                phone,
                `SPYRE: Your phone number verification OTP code: ${code}. The code will expire in 10 minutes. Please do NOT share your OTP with others.`
            );
            // await this.sendSMSInternal(
            //   phone,
            //   `[SPYRE] Your phone number verification OTP code: ${code}. The code will expire in 10 minutes. Please do NOT share your OTP with others.`,
            //   "SPYRE",
            // );
            const otpCode = new OTP();
            otpCode.code = code;
            otpCode.phone = phone;
            otpCode.userId = userId;
            await this.otpRepository.save(otpCode);
        } catch (err) {
            console.log("Failed to send otp code to ", phone, err);
            throw new InternalServerErrorException("Failed to send OTP code");
        }
    }

    async sendEmailOTPCode(userId: string, email: string): Promise<void> {
        const code = this.generateOTP();
        try {
            console.log(`Sending OTP code (${code}) to ${email}`);
            const otpCode = new OTP();
            otpCode.code = code;
            otpCode.email = email;
            otpCode.userId = userId;
            await this.otpRepository.save(otpCode);

            const user = await this.userRepository.findOne({
                where: {
                    userId
                }
            });

            await this.emailService.sendEmailVerificationOTPCode(
                email,
                `${user.firstName} ${user.lastName}`,
                code
            );
        } catch (err) {
            console.log("Failed to send otp code to ", email, err);
            throw new InternalServerErrorException("Failed to send OTP code");
        }
    }

    async sendSMS(phone: string, text: string): Promise<void> {
        // await this.sendSMSInternal(phone, text, "API Test");
        await this.textMagicService.sendSMS(phone, text);
    }

    async verifySmsOTP(userId: string, form: OtpDTO): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });

        if (form.type === VerificationType.REGISTER) {
            form.phone = user.phone;
        } else {
            form.phone = user.tempPhone;
            if (user.isEmailVerified)
                throw new UnauthorizedException(
                    "The otp is used once, phone number is already changed."
                );
        }

        const otpDb = await this.otpRepository.findOne({
            where: {
                userId: userId,
                code: form.code,
                phone: form.phone
            }
        });

        if (!otpDb) {
            throw new UnauthorizedException(
                "Wrong OTP code. Please try again."
            );
        }

        if (form.type === VerificationType.REGISTER) {
            user.isPhoneActive = true;
        } else {
            user.phone = user.tempPhone;
            user.tempPhone = null;
            user.isPhoneVerified = true;
        }

        await this.userRepository.save(user);

        return true;
    }

    async verifyEmailOTP(userId: string, form: OtpDTO): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });

        if (form.type === VerificationType.REGISTER) {
            form.email = user.email;
        } else {
            form.email = user.tempEmail;
            if (user.isEmailVerified)
                throw new UnauthorizedException(
                    "The otp is used once, email address is already changed."
                );
        }

        const otpDb = await this.otpRepository.findOne({
            where: {
                userId: userId,
                code: form.code,
                email: form.email
            }
        });

        if (!otpDb) {
            throw new UnauthorizedException(
                "Wrong OTP code. Please try again."
            );
        }

        if (form.type === VerificationType.REGISTER) {
            user.isEmailActive = true;
        } else {
            user.email = user.tempEmail;
            user.tempEmail = null;
            user.isEmailVerified = true;
        }

        await this.userRepository.save(user);

        return true;
    }

    private generateOTP(): number {
        return Math.round(Math.random() * 100000);
    }

    private async sendSMSInternal(
        phone: string,
        text: string,
        from: string
    ): Promise<void> {
        try {
            console.log(`Sending sms to ${phone}`);

            const credentials = new Auth({
                apiKey: process.env.VONAGE_API_KEY,
                apiSecret: process.env.VONAGE_API_SECRET
            });
            const options = {};
            const _vonage = new Vonage(credentials, options);

            const response = await _vonage.messages.send({
                to: phone,
                from: from,
                text: text
            });
            console.log("SMS sent to ", phone, response);
        } catch (err) {
            console.log("Failed to send sms to ", phone, err);
            throw new InternalServerErrorException("Failed to send sms.");
        }
    }
}
