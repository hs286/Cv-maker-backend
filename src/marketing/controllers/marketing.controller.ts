import {
  Controller,
  UseGuards,
  Get,
  Query,
  Post,
  Body,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { MarketingService } from '../services/marketing.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';
import { CreateTemplateDto } from '../DTOs/create-marketing-dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Marketings')
@Controller('marketing')
@UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
@ApiBearerAuth()
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('get-groups')
  getAllGroups(@Query() { oauthToken }: { oauthToken: string }) {
    return this.marketingService.getAllGroups({ oauthToken });
  }

  @Get('get-from-emails')
  getFromEmails(@Query() { oauthToken }: { oauthToken: string }) {
    return this.marketingService.getFromEmails({ oauthToken });
  }

  @Get('get-templates')
  getAllTemplates() {
    return this.marketingService.getAllTemplates({});
  }

  @Get('launch-campaign')
  launchCampaign(@Query('template_id') templateId: number) {
    return this.marketingService.launchCampaign({ templateId });
  }

  @Get('stop-campaign')
  stopCampaign(@Query('template_id') templateId: number) {
    return this.marketingService.stopCampaign({ templateId });
  }

  @Post('create-template')
  @UseInterceptors(FileInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  createTemplate(
    @Body() body: CreateTemplateDto,
    @UploadedFile() files: Express.Multer.File,
    @Query('isEdit') isEdit: boolean,
  ) {
    body.files = files;
    body.isEdit = isEdit;
    return this.marketingService.createTemplate(body);
  }
}
