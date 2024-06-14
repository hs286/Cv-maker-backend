import { Module, forwardRef } from "@nestjs/common";
import { MarketingService } from "./services/marketing.service";
import { MarketingController } from "./controllers/marketing.controller";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [HttpModule, forwardRef(() => AuthModule)],
    controllers: [MarketingController],
    providers: [MarketingService, ConfigService, JwtService],
    exports: [MarketingService],
})
export class MarketingModule {}
