import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';

@Injectable()
export class KeywordService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private logService: LogService,
  ) {}
  async get({ keyword: job_title }) {
    const apiKey = `Basic ${await this.configService.get('api.ATSApiKey')}`;
    console.log('API-KEY', apiKey);
    const apiUrl = `${await this.configService.get('api.ATSBaseUrl')}/keyword`;
    const config = {
      headers: {
        Authorization: `${apiKey}`,
        accept: 'application/json',
      },
      params: {
        job_title,
      },
    };
    try {
      const response = await firstValueFrom(
        this.httpService.get(apiUrl, config),
      );
      if (response.status === 200) {
        response.data.objects = response.data.objects.map(
          ({ word, adjusted_weightage }) => ({ word, adjusted_weightage }),
        );
        return response.data;
      } else {
        throw new Error(response.data);
      }
    } catch (error) {
      this.logService.error(`[UserService.getJobRoles] ${error}`);
      throw new InternalServerErrorException();
    }
  }
}
