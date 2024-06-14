import {
    Controller,
    UseGuards,
    Post,
    Body
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JobDescriptionService } from "../services/jobDescription.service";
import { JwtGuard, RoleGuard } from "src/auth/0auth2.0/guards";
import { Role as UserRoles } from "src/auth/0auth2.0/enums";
import { CreateJobDescriptionDto } from "../DTOs/create-job-description-dto";

@ApiTags("Job Description")
@Controller("job_description")
@UseGuards(JwtGuard, RoleGuard(UserRoles.ADMIN))
@ApiBearerAuth()
export class JobDescriptionController {
    constructor(
        private readonly jobDescriptionService: JobDescriptionService
    ) {}

    @Post()
    async create(@Body() body: CreateJobDescriptionDto) {
        return this.jobDescriptionService.create(body);
    }
}
