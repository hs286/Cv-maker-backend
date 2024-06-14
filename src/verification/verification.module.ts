import { Module } from "@nestjs/common";
import { VerificationController } from "./controllers/verification.controller";
import { VerificationService } from "./services/verification.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OTP } from "./entities/otp.entity";
import { ThirdPartyApiModule } from "../thirdPartyApi/thirdPartyApi.module";
import { EmailsModule } from "../emails/emails.module";
import { User } from "../auth/0auth2.0/entites/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([OTP, User]),
        ThirdPartyApiModule,
        EmailsModule
    ],
    controllers: [VerificationController],
    providers: [VerificationService],
    exports: [VerificationService]
})
export class VerificationModule {
}