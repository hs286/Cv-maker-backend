import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeywordService } from '../services/keyword.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';

@ApiTags('Keywords')
@Controller('keywords')
@UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
@ApiBearerAuth()
export class KeywordController {
  constructor(private readonly keywordService: KeywordService) {}

  @Get()
  async get(@Query('keyword') keyword: string) {
    return this.keywordService.get({ keyword });
  }
}
