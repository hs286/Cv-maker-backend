/* eslint-disable prettier/prettier */
import { Module, forwardRef } from "@nestjs/common";
import { WebSocketGate } from "./websocket.gateway";
import { ChatModule } from "src/chat/chat.module";
import { NotificationModule } from "src/notifications/notifications.module";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { HttpModule } from "../http/http.module";
import { TicketModule } from "../ticket/ticket.module";
import { RandomService } from "./random.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatEntity } from "./chat.entity";
import { ChatRoom } from "./chatRoom.entity";
import { SocketController } from "./socket.controller";
import { FilesModule } from "src/files/files.module";

import { User } from "src/auth/0auth2.0/entites/user.entity";
@Module({
    imports: [
        ChatModule,
        NotificationModule,
        FilesModule,
        forwardRef(() => AuthModule),
        HttpModule,
        TicketModule,
        TypeOrmModule.forFeature([ChatEntity, ChatRoom, User]),
    ],
    controllers: [SocketController],
    providers: [WebSocketGate, RandomService],
    exports: [WebSocketGate, RandomService],
})
export class WebSocketModule {}
