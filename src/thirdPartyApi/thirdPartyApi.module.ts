import { Module } from "@nestjs/common";
import { ReedService } from "./services/reed.service";
import { CvLibService } from "./services/cvLib.service";
import { TotalJobsService } from "./services/totalJobs.service";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "../application/entities/application.entity";
import { Applicant } from "../application/entities/applicant.entity";
import { CommonApplicationService } from "./services/commonApplication.service";
import { ClownFishService } from "./services/clownFish.service";
import { TextMagicService } from "./services/textMagic.service";

@Module({
    imports: [
        ConfigModule,
        HttpModule,
        TypeOrmModule.forFeature([Application, Applicant])
    ],
    providers: [
        CommonApplicationService,
        ClownFishService,
        CvLibService,
        ReedService,
        TotalJobsService,
        TextMagicService
    ],
    exports: [
        CvLibService,
        ReedService,
        TotalJobsService,
        ClownFishService,
        TextMagicService
    ]
})
export class ThirdPartyApiModule {
}
