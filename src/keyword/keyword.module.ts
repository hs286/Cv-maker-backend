import { Module, forwardRef } from "@nestjs/common";
import { KeywordService } from "./services/keyword.service";
import { KeywordController } from "./controllers/keyword.controller";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [HttpModule, forwardRef(() => AuthModule)],
    controllers: [KeywordController],
    providers: [KeywordService, ConfigService, JwtService],
    exports: [KeywordService],
})
export class KeywordModule {}
