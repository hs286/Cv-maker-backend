import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from '../dtos/feedback.dto';
import { User } from '../../auth/0auth2.0/entites/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async createFeedback(userId: string, createFeedbackDto: CreateFeedbackDto): Promise<any> {
    console.log('createFeedback function called');

    try {
      const user = await this.userRepository.findOne({
        where: {
          userId
        }
      });

      if (!user || !user?.userId) {
        throw new NotFoundException('User not found');
      }

      const feedback = this.feedbackRepository.create({ ...createFeedbackDto, userId: user });
      await this.feedbackRepository.save(feedback);
      return { success: true, message: "Feedback sent successfully" }
    } catch (error) {
      console.error('Error in createFeedback:', error);
      throw error;
    }
  }

  async getRecentFeedbackCount(userId: string): Promise<any> {
    console.log('getRecentFeedbackCount function called');

    try {
      const user = await this.userRepository.findOne({
        where: {
          userId
        }
      });

      if (!user || !user?.userId) {
        throw new NotFoundException('User not found');
      }

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const count = await this.feedbackRepository.createQueryBuilder('feedback')
        .where('feedback.userId = :userId', { userId: user.userId })
        .andWhere('feedback.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getCount();

      return { count };
    } catch (error) {
      console.error('Error in getRecentFeedbackCount:', error);
      throw error;
    }
  }

  async getAllFeedbacks(
    page: number,
    limit: number,
    name?: string,
    email?: string,
  ): Promise<{ data: any; count: number }> {
    console.log('getAllFeedbacks function called');

    try {
      const query = this.feedbackRepository.createQueryBuilder('feedback')
        .leftJoinAndSelect('feedback.userId', 'user')
        .select([
          'feedback.id',
          'feedback.isDone',
          'feedback.feedback',
          'feedback.createdAt',
          'user.firstName',
          'user.lastName'
        ])
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('feedback.createdAt', 'ASC');

      if (name && email) {
        query.where('LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE LOWER(:name)', { name: `%${name}%` })
          .orWhere('LOWER(user.email) LIKE LOWER(:email)', { email: `%${email}%` });
      } else if (name) {
        query.where('LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE LOWER(:name)', { name: `%${name}%` });
      } else if (email) {
        query.where('LOWER(user.email) LIKE LOWER(:email)', { email: `%${email}%` });
      }

      const [result, total] = await query.getManyAndCount();

      return { data: result, count: total };
    } catch (error) {
      console.error('Error in getAllFeedbacks:', error);
      throw error;
    }
  }

  async updateIsDone({ id, isDone }: UpdateFeedbackStatusDto): Promise<object> {
    console.log('updateIsDone function called');

    try {
      const feedback = await this.feedbackRepository.findOne({
        where: {
          id
        }
      });

      if (!feedback) {
        throw new NotFoundException(`Feedback with id ${id} not found`);
      }

      feedback.isDone = isDone;
      await this.feedbackRepository.save(feedback);
      return { success: true, message: `Feedback with id ${id} updated successfully` }
    } catch (error) {
      console.error('Error in updateIsDone:', error);
      throw error;
    }
  }

  async deleteFeedback(id: number): Promise<object> {
    console.log('deleteFeedback function called');

    try {
      const feedback = await this.feedbackRepository.findOne({
        where: {
          id
        }
      });

      if (!feedback) {
        throw new NotFoundException(`Feedback with id ${id} not found`);
      }

      await this.feedbackRepository.delete(id);

      return { success: true, message: "Feedback deleted successfully" }
    } catch (error) {
      console.error('Error in deleteFeedback:', error);
      throw error;
    }
  }
}
