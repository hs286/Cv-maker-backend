import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CronService } from "./cron.service";

@ApiTags("Cron Jobs Manual Trigger")
@Controller("cron")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
export class CronController {
    constructor(private cronService: CronService) {}

    @Get("/trigger-auto-signup")
    async triggerAutoSignup() {
        return this.cronService.checkValidUsersForCVLibSignUp();
    }
}
