import { Module, forwardRef } from "@nestjs/common";
import { ScoreService } from "./services/score.service";
import { ScoreController } from "./controllers/score.controller";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [HttpModule, forwardRef(() => AuthModule)],
    controllers: [ScoreController],
    providers: [ScoreService, ConfigService, JwtService],
    exports: [ScoreService],
})
export class ScoreModule {}
