import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileService } from "./services/profile.service";

import { ProfileController } from "./controllers/profile.controller";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { AuthModule } from "src/auth/0auth2.0/auth.module";
import { HttpModule } from "@nestjs/axios";
import { JobRole } from "src/auth/0auth2.0/entites/jobRole.entity";
import { CVProfile } from "./entities/CVProfile.entity";
import { JwtService } from "@nestjs/jwt/dist";
import { FilesModule } from "../files/files.module";
import { ServicesModule } from "../services/services.module";
import { ServicesService } from "../services/services/services.service";
import { VerificationModule } from "../verification/verification.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, JobRole, CVProfile]),
        forwardRef(() => AuthModule),
        forwardRef(() => FilesModule),
        // forwardRef(() => ServicesModule),
        ServicesModule,
        VerificationModule,
        HttpModule
    ],
    controllers: [ProfileController],
    providers: [ProfileService, JwtService, ServicesService],
    exports: [ProfileService]
})
export class ProfileModule {
}
