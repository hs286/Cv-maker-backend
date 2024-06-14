import { Module } from "@nestjs/common";
import { ChatController } from "./controller/chat.controller";
import { ChatService } from "./service/chat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "../notifications/entites/notification.entity";
import { User } from "../auth/0auth2.0/entites/user.entity";
import { HttpModule } from "../http/http.module";
import { TicketModule } from "../ticket/ticket.module";
import { Conversation } from "../conversation/entites/conversation.entity";
import { Message } from "../messages/entites/message.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, User, Notification]),
    HttpModule,TicketModule
  ],
  // controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {
}
