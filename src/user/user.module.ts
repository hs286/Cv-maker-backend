import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JobRole } from 'src/auth/0auth2.0/entites/jobRole.entity';
import { User } from 'src/auth/0auth2.0/entites/user.entity';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { FileSystemModule } from 'src/utils/file-sytem/file-sytem.module';
import { FilesModule } from 'src/files/files.module';
import { CVProfile } from 'src/profile/entities/CVProfile.entity';
import { Applicant } from 'src/application/entities/applicant.entity';
import { TempClient } from 'src/auth/0auth2.0/entites/temptClient.entity';
import { ChatRoom } from 'src/websocket/chatRoom.entity';
import { Conversation } from 'src/conversation/entites/conversation.entity';
import { UserTicket } from 'src/ticket/entities/userTicket.entity';
import { CvMakerFile } from 'src/cv_maker/entities/cvMaker.entity';
import { Message } from 'src/messages/entites/message.entity';
import { Notification } from 'src/notifications/entites/notification.entity';
import { OTP } from 'src/verification/entities/otp.entity';
import { ScrappedJobEntity } from 'src/jobScrapper/entities/jobScrapper.entity';
import { ChatEntity } from 'src/websocket/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, JobRole, CVProfile, TempClient, ChatRoom, Conversation, UserTicket, CvMakerFile, CVProfile, JobRole, Message, Notification, OTP, ScrappedJobEntity, ChatEntity]),
    FileSystemModule,
    FilesModule,
    HttpModule,
  ],
  controllers: [UserController],
  providers: [UserService, ConfigService],
  exports: [UserService],
})
export class UserModule {}
