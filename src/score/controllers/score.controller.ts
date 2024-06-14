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
import { ScoreService } from '../services/score.service';
import { JwtGuard, RoleGuard } from 'src/auth/0auth2.0/guards';
import { Role as UserRoles } from 'src/auth/0auth2.0/enums';
import { CreateScoreDto } from '../DTOs/create-score-dto';

@ApiTags('Scores')
@Controller('score')
@UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
@ApiBearerAuth()
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Post()
  async create(@Body() body: CreateScoreDto, @Request() req: any) {
    body.user_id = req.user.sub;
    return this.scoreService.create(body);
  }

  @Post('parse-word')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async parseWord(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.scoreService.parseWord(file.buffer);
  }

  @Post('parse-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async parsePdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.scoreService.parsePdf(file.buffer);
  }
}
