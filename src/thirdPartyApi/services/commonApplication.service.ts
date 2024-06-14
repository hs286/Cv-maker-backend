import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "../../application/entities/application.entity";
import { Repository } from "typeorm";
import { Applicant } from "../../application/entities/applicant.entity";
import { ApplyFormDto } from "../../application/DTOs/applyForm.dto";
import { ScrapeSource } from "../../auth/0auth2.0/enums";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CommonApplicationService {
  private readonly logger = new Logger(CommonApplicationService.name);

  constructor(
    @InjectRepository(Application) public applicationRepository: Repository<Application>,
    @InjectRepository(Applicant) public applicantRepository: Repository<Applicant>
  ) {
  }

  async saveApplication(applyForm: ApplyFormDto, source: ScrapeSource, applyCount) {

    if (applyCount === 0) {
      console.warn(`Apply count ${applyCount} on ${source}`);
      return;
    }

    const applicant = await this.applicantRepository.findOne({
      where: {
        userId: applyForm.userId
      }
    });

    let application = new Application();

    application.applicant = applicant;
    application.userId = applyForm.userId;
    application.jobTitle = applyForm.jobTitles[0];
    application.location = applyForm.county;
    application.applyCount = applyCount;
    application.source = source;

    application = await this.applicationRepository.save(application);

    console.log(`Application saved int database.`);

    return application;
  }
}