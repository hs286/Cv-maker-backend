import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./controllers/auth.controller";
import { User } from "./entites/user.entity";
import { AuthService } from "./services/auth.service";
import { AtStrategy } from "./stratergies";
import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { JobRole } from "./entites/jobRole.entity";
import { EmailSendingService } from "src/emails/services/email.service";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { TempClient } from "./entites/temptClient.entity";
import { FilesModule } from "../../files/files.module";
import { Location } from "../../mise/entities/location.entity";
import { PaymentIntentModule } from "../../payments/paymentIntent.module";
import { PackageModule } from "../../packageAndService/package/package.module";
import { ServiceModule } from "../../packageAndService/service/service.module";
import { ValuatorModule } from "src/valuator/valuator.module";
@Module({
    imports: [
        JwtModule.register({}),
        TypeOrmModule.forFeature([
            User,
            TempClient,
            JobRole,
            CVProfile,
            Location
        ]),
        HttpModule,
        FilesModule,
        PackageModule,
        ServiceModule,
        PaymentIntentModule,
        forwardRef(() => ValuatorModule)
    ],
    controllers: [AuthController],
    providers: [AtStrategy, AuthService, ConfigService, EmailSendingService],
    exports: [AuthService, EmailSendingService, TypeOrmModule]
})
export class AuthModule {}
