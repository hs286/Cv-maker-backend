import { Module, forwardRef } from "@nestjs/common";
import { JobDescriptionService } from "./services/jobDescription.service";
import { JobDescriptionController } from "./controllers/jobDescription.controller";
import { ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [HttpModule, forwardRef(() => AuthModule)],
    controllers: [JobDescriptionController],
    providers: [JobDescriptionService, ConfigService, JwtService],
    exports: [JobDescriptionService],
})
export class JobDescriptionModule {}
