import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FeedbackService } from '../service/feedback.service';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from '../dtos/feedback.dto';
import { Feedback } from '../entities/feedback.entity';
import { AuthGuard } from '@nestjs/passport';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role } from 'src/auth/0auth2.0/enums';
import { Request } from 'express';

@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@ApiTags('Feedback')
@Controller('feedback')


export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Successfully created feedback.',
  })
  @UseGuards(JwtGuard, RoleGuard(Role.CLIENT))
  async createFeedback(@Req() req: Request, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(req.user["sub"], createFeedbackDto);
  }

  @Get('recent-feedback')
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved recent feedback.',
  })
  @UseGuards(JwtGuard, RoleGuard(Role.CLIENT))
  async getRecentFeedback(@Req() req: Request) {
    return this.feedbackService.getRecentFeedbackCount(req.user["sub"]);
  }
  


  @Get()
  @ApiQuery({ name: 'page', type: Number })
  @ApiQuery({ name: 'limit', type: Number })
  @ApiQuery({ name: 'name', type: String, required: false })
  @ApiQuery({ name: 'email', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched feedbacks.',
  })
  @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
 async getAllFeedbacks(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('name') name?: string,
  @Query('email') email?: string,
) {
  return this.feedbackService.getAllFeedbacks(page, limit, name, email);
}


  @Patch()
  @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
  @ApiResponse({
    status: 200,
    description: 'Successfully updated feedback.',
  })
  @ApiBody({ type: UpdateFeedbackStatusDto })
  async updateIsDone(
    @Body() UpdateFeedbackStatusDto: UpdateFeedbackStatusDto,
  ): Promise<object> {
    return await this.feedbackService.updateIsDone(UpdateFeedbackStatusDto);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted feedback.',
  })
  @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
  async deleteFeedback(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.deleteFeedback(id);
  }
}
