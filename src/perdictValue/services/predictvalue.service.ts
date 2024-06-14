import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';
import { CreatePredictValueDto } from '../DTOs/create-predictvalue-dto';

@Injectable()
export class PredictValueService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private logService: LogService,
  ) { }

  async create(data: CreatePredictValueDto) {
    const body = {
      data: data.file,
      job_title: data.target_role,
      user_id: data.user_id

    }
    if (!data.file.info) {
      return "File is required"
    }
    if (!data.target_role) {
      return "Target role is required"
    }

    const apiKey = await this.configService.get("api.CVValuatorApiKey");

    const apiUrl = `${await this.configService.get(
      "api.CVValuatorApiUrl"
    )}/predict_value_processed`;

    const config = {
      headers: {
        "api-key": apiKey,
        "Content-Type": "multipart/form-data"
      }
    };

    const requestBody = {
      cv_data: data.file,
      target_role: data.target_role
    }

    try {
      console.log("Calling CV Valuator", apiUrl, requestBody);
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestBody, config)
      );
      console.log("Response from CV Evaluator", apiUrl, response.status, response.data);
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
