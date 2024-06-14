import {
  Controller,
  UseGuards,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PredictValueService } from '../services/predictvalue.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';
import { CreatePredictValueDto } from '../DTOs/create-predictvalue-dto';

@ApiTags('Predict Values')
@Controller('predict_value')
@UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
@ApiBearerAuth()
export class PredictValueController {
  constructor(private readonly predictValueService: PredictValueService) {}

  @Post()
  async create(@Body() body: CreatePredictValueDto, @Request() req: any) {
    body.user_id = req.user.sub;
    const data = body
    return this.predictValueService.create(data);
  }
}
