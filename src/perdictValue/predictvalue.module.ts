import { Module, forwardRef } from "@nestjs/common";
import { PredictValueService } from "./services/predictvalue.service";
import { PredictValueController } from "./controllers/predictvalue.controller";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [HttpModule, forwardRef(() => AuthModule)],
    controllers: [PredictValueController],
    providers: [PredictValueService, ConfigService, JwtService],
    exports: [PredictValueService],
})
export class PredictValueModule {}
