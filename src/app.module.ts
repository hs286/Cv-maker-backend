import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/0auth2.0/auth.module";
import { ScheduleModule } from "@nestjs/schedule";
import apiConfig from "./config/api.config";
import authConfig from "./config/auth.config";
import { DB_TYPE } from "./globals/enums";
import { ProfileModule } from "./profile/profile.module";
import { UserModule } from "./user/user.module";
import { ValuatorModule } from "./valuator/valuator.module";
import { JobScrapperModule } from "./jobScrapper/jobScrapper.module";
import { ServicesModule } from "./services/services.module";
import { LoggerModule } from "./logger";
import { PaymentIntentModule } from "./payments/paymentIntent.module";
import { FilesModule } from "./files/files.module";
import { CronModule } from "./cron/cron.module";
import { EmailsModule } from "./emails/emails.module";
import { ChatModule } from "./chat/chat.module";
import { WebSocketModule } from "./websocket/websocket.module";
import { NotificationModule } from "./notifications/notifications.module";
import { HttpModule } from "./http/http.module";
import { TicketModule } from "./ticket/ticket.module";
import { MiseModule } from "./mise/mise.module";
import { ApplicationModule } from "./application/application.module";
import { CvMakerModule } from "./cv_maker/cv_maker.module";
import { KeywordModule } from "./keyword/keyword.module";
import { ScoreModule } from "./score/score.module";
import { JobDescriptionModule } from "./jobDescription/jobDescription.module";
import { CvTypeModule } from "./cv_type/cv_type.module";
import { VerificationModule } from "./verification/verification.module";
import { ThirdPartyApiModule } from "./thirdPartyApi/thirdPartyApi.module";
import { MarketingModule } from "./marketing/marketing.module";
import { PackageModule } from "./packageAndService/package/package.module";
import { ServiceModule } from "./packageAndService/service/service.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { PredictValueModule } from "./perdictValue/predictvalue.module";

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, ".."),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [authConfig, apiConfig],
            envFilePath: [".env"],
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            type: DB_TYPE.db_type,
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            entities: [__dirname + "/**/*.entity{.ts,.js}"],
            synchronize: true, // set to false in production
            // logging: true
        }),
        LoggerModule,
        AuthModule,
        ProfileModule,
        WebSocketModule,
        ValuatorModule,
        JobScrapperModule,
        UserModule,
        ServicesModule,
        PaymentIntentModule,
        FilesModule,
        CronModule,
        EmailsModule,
        HttpModule,
        TicketModule,
        ChatModule,
        NotificationModule,
        MiseModule,
        ApplicationModule,
        CvMakerModule,
        KeywordModule,
        ScoreModule,
        JobDescriptionModule,
        CvTypeModule,
        VerificationModule,
        ThirdPartyApiModule,
        MarketingModule,
        PackageModule,
        ServiceModule,
        FeedbackModule,
        PredictValueModule,
    ],
    controllers: [AppController],
    providers: [AppService],
    exports: [AppService],
})
export class AppModule {}
