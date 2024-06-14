import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ClownFishService {
    private readonly logger = new Logger(ClownFishService.name);

    constructor(
        private httpService: HttpService,
        private configService: ConfigService
    ) {}

    async generateEmail(firstName: string, lastName: string, email: string) {
        const apiKey = await this.configService.get("api.ClownFishApiKey");
        const apiUrl = `${await this.configService.get(
            "api.ClownFishBaseUrl"
        )}/${firstName}/${lastName}/${email}`;

        const config = {
            headers: {
                "X-API-KEY": apiKey
            }
        };

        console.log(`Calling email generator service`);

        const response = await firstValueFrom(
            this.httpService.get(apiUrl, config)
        );

        console.log(`Response from email generator`, apiUrl, response.data);

        return response.data.generated_email;
    }
}
