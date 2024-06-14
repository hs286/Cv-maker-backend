import {
  Body,
  Controller,
  UseGuards,
  Post,
  Req,
  Res,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { ApiResponse } from 'src/globals/responses';
import { ServicesService } from '../services/services.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';
import {
  HelpChoosePlanDTO,
  IndividualServicesCheckoutDTO,
  MoveToNextServiceDTO,
} from '../DTOs';
import { Request, Response } from 'express';

@ApiTags('services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiBody({
    description: 'Questions',
    type: HelpChoosePlanDTO,
  })
  @ApiOkResponse({
    description: 'Recommended Plan Created',
    type: ApiResponse,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('helpChoosePlan')
  async helpChoosePlan(@Body() helpChoosePlanDto: HelpChoosePlanDTO) {
    return this.servicesService.helpChoosePlan(helpChoosePlanDto);
  }

  @ApiBody({
    description: 'Services',
    type: IndividualServicesCheckoutDTO,
  })
  @ApiOkResponse({
    description: 'Recommended Plan Created',
    type: ApiResponse,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('individualServicesCheckout')
  async individualServicesCheckout(
    @Body() individualServicesCheckoutDTO: IndividualServicesCheckoutDTO,
    @Req() req: Request,
  ) {
    return this.servicesService.individualServicesCheckout(
      req.user['sub'],
      individualServicesCheckoutDTO,
    );
  }

  @ApiOkResponse({
    description: 'Service moved to next stage',
    type: ApiResponse,
  })
  @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
  @Post('moveToNextService')
  async moveToNextService(
    @Body() body: MoveToNextServiceDTO,
    @Res() res: Response,
  ) {
    const data = await this.servicesService.moveToNextService(body);
    return res.status(data.statusCode).json(data);
  }

  @ApiOkResponse({
    description: 'Only Admin can call this API, and it will return services of the clients',
    type: ApiResponse,
  })
  @ApiQuery({ name: 'userId', type: String, required: false })
  @UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
  @Get('adminGetAllClientServices')
  async clientServices(
    @Res() res: Response,
    @Query('userId')
    userId: string,
  ) {
    const data = await this.servicesService.getServices(userId);
    return res.status(data.statusCode).json(data);
  }

  @ApiOkResponse({
    description: 'Only Client can call this API, and it will return his/her services',
    type: ApiResponse,
  })
  @UseGuards(JwtGuard, RoleGuard(UserRoles.CLIENT))
  @Get('clientMyServices')
  async myServices(@Req() req: Request, @Res() res: Response) {
    const data = await this.servicesService.getServices(req?.user?.['sub']);
    return res.status(data.statusCode).json(data);
  }
}
