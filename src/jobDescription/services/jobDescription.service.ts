import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';
import { CreateJobDescriptionDto } from '../DTOs/create-job-description-dto';

@Injectable()
export class JobDescriptionService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private logService: LogService,
  ) {}
  async create(body: CreateJobDescriptionDto) {
    const apiKey = `Basic ${await this.configService.get('api.ATSApiKey')}`;
    console.log('API-KEY', apiKey);
    const apiUrl = `${await this.configService.get('api.ATSBaseUrl')}/job_description`;
    const config = {
      headers: {
        Authorization: `${apiKey}`,
        accept: 'application/json',
      }
    };
    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, body, config),
      );
      if (response.status === 200) {
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
