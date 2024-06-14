import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AuthService } from "../auth/0auth2.0/services/auth.service";
import { ApplicationService } from "../application/services/application.service";

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);
    private readonly batchSize = 10;

    constructor(
        private readonly authService: AuthService,
        private readonly applicationService: ApplicationService
    ) {}

    // Auto signup in CV Library & Reed
    @Cron(CronExpression.EVERY_30_SECONDS)
    async checkValidUsersForCVLibSignUp() {
        const totalUnSignedUsers =
            await this.authService.getUnSignedUsersCount();

        console.log(
            `Total UnSigned Users: ${totalUnSignedUsers} by time: ${new Date()}`
        );

        let totalChunks = this.calculateChunks(totalUnSignedUsers);

        for (let i = 0; i < totalChunks; i++) {
            const response = await this.authService.getUnsignedUsers({
                start: i * this.batchSize,
                limit: this.batchSize
            });

            totalChunks = this.calculateChunks(response.total);

            for (const user of response.data) {
                try {
                    await this.applicationService.createApplicantFromUser(user);
                } catch (err) {
                    console.error("Failed to signup. Error: ", err);
                }
            }
        }
    }

    // ApplyMate auto apply feature
    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async autoApplyScheduler() {
        console.log("Running Auto Jobs Apply Cron Job");

        // fetch auto apply on applicants
        const applicants =
            await this.applicationService.getAutoApplyApplicants();

        let promises = [];
        for (let i = 0; i < applicants.length; i++) {
            // find the last applied applications within 1 week
            const lastApply = await this.applicationService.getLastApply(
                applicants[i].userId
            );
            console.log("LastApply", applicants[i].userId, lastApply);
            if (lastApply) {
                // apply for the jobs
                promises.push(
                    this.applicationService.applyJob({
                        userId: applicants[i].userId,
                        email: applicants[i].email,
                        county: applicants[i].county,
                        jobTitles: [applicants[i].desiredJob]
                    })
                );
            }

            if (promises.length > 100) {
                await Promise.all(promises);
                promises = [];
            }
        }
    }

    private calculateChunks = (total: number) => {
        return Math.ceil(total / this.batchSize);
    };
}
