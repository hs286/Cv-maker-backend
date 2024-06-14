import { Controller, UseGuards, Get, Post, Body, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PackageService } from '../services/package.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';
import { AuthGuard } from '@nestjs/passport';
import { BulkCreateServicesAndPackagesDto } from '../DTOs/bulk-create-services-and-packages-dto';
import { Response } from 'express';

@ApiTags('Package')
@Controller('packageAndService/packages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PackageController {
  constructor(private readonly packageService: PackageService) {}
  @Get()
  async getAll(@Res() res: Response) {
    const result = await this.packageService.getAll();

    res.status(result.statusCode).json(result);
  }

  @Post('bulk-create-packages-and-services')
  async createPackagesAndServices(
    @Body() data: BulkCreateServicesAndPackagesDto,
    @Res() res: Response,
  ) {
    const result = await this.packageService.createPackagesAndServices(data);

    res.status(result.statusCode).json(result);
  }
}
