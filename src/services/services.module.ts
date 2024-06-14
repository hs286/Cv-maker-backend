import { Module } from "@nestjs/common";
import { ServicesController } from "./controllers/services.controller";
import { ServicesService } from "./services/services.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScrappedJobEntity } from "../jobScrapper/entities/jobScrapper.entity";
import { User } from "../auth/0auth2.0/entites/user.entity";
import { JobRole } from "../auth/0auth2.0/entites/jobRole.entity";
import { CVProfile } from "../profile/entities/CVProfile.entity";
import { EmailsModule } from "../emails/emails.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailsModule],
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServicesModule {
}
