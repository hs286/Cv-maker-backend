import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';
import { CreateTemplateDto } from '../DTOs/create-marketing-dto';
// import FormData from 'form-data';
import * as FormData from 'form-data';
import { createReadStream } from 'fs';

@Injectable()
export class MarketingService {
  private readonly BASE_URL =  this.configService.get<string>('api.MarketingBaseUrl');
  private readonly OAUTH_TOKEN = this.configService.get<string>('api.MarketingOauthToken');
  private readonly API_KEY = this.configService.get<string>('api.MarketingApiKey');

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private logService: LogService,
  ) {}

  async getAllGroups({}) {
    const apiUrl = `${this.BASE_URL}/get-groups`;
    const config = this.getRequestConfig();

    const data = await this.handleRequest(apiUrl, config);

    data.data = data?.data?.map(({ id, name }) => ({ id, name }));

    return data;
  }

  async getFromEmails({}) {
    const apiUrl = `${this.BASE_URL}/get-from-emails`;
    const config = this.getRequestConfig();

    const data = await this.handleRequest(apiUrl, config);

    data.data = data?.data?.map(({ id, email }) => ({ id, email }));

    return data;
  }

  async getAllTemplates({}) {
    const apiUrl = `${this.BASE_URL}/get-templates`;
    const config = this.getRequestConfig();

    return this.handleRequest(apiUrl, config);
  }

  async launchCampaign({ templateId }) {
    const apiUrl = `${this.BASE_URL}/launch-campaign?template_id=${templateId}`;
    const config = this.getRequestConfig();

    return this.handleRequest(apiUrl, config);
  }

  async stopCampaign({ templateId }) {
    const apiUrl = `${this.BASE_URL}/stop-campaign?template_id=${templateId}`;
    const config = this.getRequestConfig();

    return this.handleRequest(apiUrl, config);
  }

  async createTemplate(createTemplateDto: CreateTemplateDto) {
    const apiUrl = `${this.BASE_URL}/${createTemplateDto?.isEdit ? 'update-template' : 'create-template'}`;
    const config = this.getRequestConfig();

    const formData = new FormData();

    formData.append('template_name', createTemplateDto.template_name);
    formData.append('first_name', createTemplateDto.first_name)
    formData.append('last_name', createTemplateDto.last_name)
    formData.append('start_date', createTemplateDto.start_date);
    formData.append('end_date', createTemplateDto.end_date);
    formData.append('switch_count', createTemplateDto.switch_count);
    formData.append('email_subject', createTemplateDto.email_subject);
    formData.append('email_title', createTemplateDto.email_title);
    formData.append('reply_to', createTemplateDto.reply_to);
    formData.append('no_of_emails', createTemplateDto.no_of_emails);
    formData.append('interval', createTemplateDto.interval);
    formData.append('description', createTemplateDto.description);
    formData.append('unsubs_text', createTemplateDto.unsubs_text);
    formData.append('status', createTemplateDto.status);

    if (createTemplateDto.from_emails) {
      formData.append('from_emails', createTemplateDto.from_emails);
    }

    if (createTemplateDto.groups) {
      formData.append('groups', createTemplateDto.groups);
    }

    if (createTemplateDto.template_id) {
      formData.append('template_id', createTemplateDto.template_id);
    }

    formData.append('oauth_token', this.OAUTH_TOKEN);

    if (createTemplateDto.files) {
      formData.append(
        'files',
        createTemplateDto.files.buffer,
        createTemplateDto.files.originalname,
      );
    }

    const data = await this.handleRequest(apiUrl, config, formData);

    return data;
  }

  private async handleRequest(apiUrl: string, config: any, data?: any) {
    try {
      const response = await firstValueFrom(
        data
          ? this.httpService.post(apiUrl, data, config)
          : this.httpService.get(apiUrl, config),
      );

      if (response.status === 200 || response.status === 201) {
        return response.data;
      } else {
        throw new Error(response.data);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private getRequestConfig() {
    const headers = {
      Authorization: `${this.API_KEY}`,
      Accept: 'application/json',
    };

    return { headers, params: { oauth_token: this.OAUTH_TOKEN } };
  }

  private handleError(error: any) {
    this.logService.error(`[MarketingService] ${error}`);
    throw new InternalServerErrorException();
  }
}
