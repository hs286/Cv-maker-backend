import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationController } from "./notifications.controller";
import { NotificationService } from "./notifications.service";
import { ChatModule } from "src/chat/chat.module";
import { UserModule } from "src/user/user.module";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { Notification } from "./entites/notification.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        ChatModule,
        forwardRef(() => AuthModule),
        UserModule,
    ],
    // controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
