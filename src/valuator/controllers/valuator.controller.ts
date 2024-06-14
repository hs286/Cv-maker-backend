import { Req, Controller, UseGuards, Get } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ValuatorService } from '../services/valuator.service';
import { ApiResponse } from 'src/globals/responses';
import { Request } from 'express';

@ApiTags('CV_Valuator')
@Controller('valuator')
@ApiBearerAuth()
export class ValuatorController {
  constructor(private readonly valuatorService: ValuatorService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('valuateProfile')
  @ApiOkResponse({
    description: 'cv valuation done from users cv profile from db.',
    type: ApiResponse,
  })
  @ApiNotFoundResponse({
    description: 'In case user is not found',
  })
  async valuateProfile(@Req() req: Request) {
    return await this.valuatorService.valuateProfile(req.user['sub']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('valuateProfileUK')
  @ApiOkResponse({
    description: 'cv valuation done from users cv profile from db.',
    type: ApiResponse,
  })
  @ApiNotFoundResponse({
    description: 'In case user is not found',
  })
  async valuateProfileUK(@Req() req: Request) {
    return await this.valuatorService.valuateProfileUK(req.user['sub']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getMedianSalaryWithLocation')
  @ApiOkResponse({
    description: 'cv valuation done from users location from db.',
    type: ApiResponse,
  })
  @ApiNotFoundResponse({
    description: 'Median Salary with location',
  })
  async getCountryMedianWithLocation(@Req() req: Request) {
    return await this.valuatorService.getMedianSalaryByLocation(
      req.user['sub'],
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getMeanSalary')
  @ApiOkResponse({
    description: 'cv valuation done from target role.',
    type: ApiResponse,
  })
  @ApiNotFoundResponse({
    description: 'No Median Salary Found ',
  })
  async getCountryMeanSalary(@Req() req: Request) {
    return await this.valuatorService.getMeanSalary(req.user['sub']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getScoresFromCV')
  @ApiOkResponse({
    description: ' keyword score and grammer score from CV (stringified).',
    type: ApiResponse,
  })
  async getScoresFromCV(@Req() req: Request) {
    return await this.valuatorService.getAllScoresFromCV(req.user['sub']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getUserValuationFromDB')
  @ApiOkResponse({
    description: 'cv valuation retrieved from DB.',
    type: ApiResponse,
  })
  @ApiNotFoundResponse({
    description: 'null ',
    type: null,
  })
  async getValuationFromDB(@Req() req: Request) {
    return await this.valuatorService.getUserValuationFromDB(req.user['sub']);
  }
}
