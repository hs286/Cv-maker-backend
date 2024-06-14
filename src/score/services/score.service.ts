import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';
import { CreateScoreDto } from '../DTOs/create-score-dto';
import * as mammoth from 'mammoth';
import * as pdf from 'pdf-parse';

@Injectable()
export class ScoreService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private logService: LogService,
  ) {}

  async create(body: CreateScoreDto) {
    const apiKey = `Basic ${await this.configService.get('api.ATSApiKey')}`;
    console.log('API-KEY', apiKey);
    const apiUrl = `${await this.configService.get('api.ATSBaseUrl')}/score`;
    const config = {
      headers: {
        Authorization: `${apiKey}`,
        accept: 'application/json',
      },
    };
    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, body, config),
      );
      if (response.status === 201) {
        return response.data;
      } else {
        throw new Error(response.data);
      }
    } catch (error) {
      this.logService.error(`[UserService.getJobRoles] ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async parseWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logService.error(`[ScoreService.parseWord] ${error}`);
      throw new InternalServerErrorException('Failed to parse Word document');
    }
  }

  async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      this.logService.error(`[ScoreService.parsePdf] ${error}`);
      throw new InternalServerErrorException('Failed to parse PDF document');
    }
  }
}
