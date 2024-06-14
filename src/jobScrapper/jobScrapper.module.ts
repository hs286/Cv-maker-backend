import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { ScrappedJobEntity } from "./entities/jobScrapper.entity";
import { JobScrapperService } from "./services/jobScrapper.service";
import { JobScrapperController } from "./controllers/jobScrapper.controller";
import { AuthModule } from "src/auth/0auth2.0/auth.module";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { JobRole } from "src/auth/0auth2.0/entites/jobRole.entity";
import { JwtService } from "@nestjs/jwt";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { ThirdPartyApiModule } from "../thirdPartyApi/thirdPartyApi.module";
import { WebSocketGate } from "src/websocket/websocket.gateway";
import { ChatModule } from "src/chat/chat.module";
import { NotificationModule } from "src/notifications/notifications.module";
import { FilesModule } from "src/files/files.module";
import { TicketModule } from "src/ticket/ticket.module";
import { ChatEntity } from "src/websocket/chat.entity";
import { ChatRoom } from "src/websocket/chatRoom.entity";
import { RandomService } from "src/websocket/random.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([ScrappedJobEntity, User, JobRole, CVProfile,ChatEntity, ChatRoom]),
        HttpModule,
        AuthModule,
        ThirdPartyApiModule,
        ChatModule,
        NotificationModule,
        FilesModule,
        TicketModule,
    ],
    providers: [ConfigService, JobScrapperService, JwtService, WebSocketGate, RandomService],
    controllers: [JobScrapperController],
    exports: [JobScrapperService]
})
export class JobScrapperModule {}
