import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackService } from './service/feedback.service';
import { FeedbackController } from './controller/feedback.controller';
import { Feedback } from './entities/feedback.entity';
import { User } from '../auth/0auth2.0/entites/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, User])],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule { }
