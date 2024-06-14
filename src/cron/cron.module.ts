import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { CronService } from "./cron.service";
import { AuthModule } from "../auth/0auth2.0/auth.module";
import { ApplicationModule } from "../application/application.module";
import { CronController } from "./cron.controller";

@Module({
    imports: [
        ScheduleModule.forRoot(),
        forwardRef(() => AuthModule),
        ApplicationModule
    ],
    providers: [CronService],
    controllers: [CronController],
    exports: [CronService]
})
export class CronModule {}
