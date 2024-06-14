import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Applicant } from "./entities/applicant.entity";
import { Application } from "./entities/application.entity";
import { ApplicationController } from "./controllers/application.controller";
import { ApplicationService } from "./services/application.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { ThirdPartyApiModule } from "../thirdPartyApi/thirdPartyApi.module";
import { User } from "../auth/0auth2.0/entites/user.entity";

@Module({
    imports: [
        HttpModule,
        ThirdPartyApiModule,
        TypeOrmModule.forFeature([Applicant, Application, User])
    ],
    controllers: [ApplicationController],
    providers: [ApplicationService, ConfigService],
    exports: [ApplicationService]
})
export class ApplicationModule {}
