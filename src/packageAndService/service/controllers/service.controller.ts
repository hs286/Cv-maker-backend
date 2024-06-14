import {
  Controller,
  UseGuards,
  Get,
  Query,
  Post,
  Body,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServiceService } from '../services/service.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@ApiTags('Services')
@Controller('packageAndService/services')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}
  @Get()
  async getAll(@Res() res: Response) {
    const result = await this.serviceService.getAll();

    res.status(result.statusCode).json(result);
  }
}
