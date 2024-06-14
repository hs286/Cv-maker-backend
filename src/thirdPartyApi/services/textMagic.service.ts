import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

@Injectable()
export class TextMagicService {
  private readonly logger = new Logger(TextMagicService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
  }

  async sendSMS(phone: string, text: string) {
    const apiKey = await this.configService.get("api.TextMagicApiKey");
    const username = await this.configService.get("api.TextMagicUsername");
    const apiUrl = `${await this.configService.get(
      "api.TextMagicBaseUrl",
    )}/messages`;

    const config = {
      headers: {
        "X-Tm-Key": apiKey,
        "X-Tm-Username": username,
      },
    };

    const formData = new FormData();
    formData.append("text", text);
    formData.append("phones", phone);

    try {
      console.log(`Calling text magic service`);
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, formData, config),
      );
      console.log(`Response from text magic`, apiUrl, response.data);
      return response.data;
    } catch (err) {
      console.error(
        `Failed to send sms through Text Magic.`,
        apiUrl,
        formData,
        err.response?.status,
        err.response?.data ?? JSON.stringify(err),
      );
      throw new InternalServerErrorException(
        "Failed to send sms through Text Magic.",
      );
    }
  }
}
