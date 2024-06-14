import { Module } from "@nestjs/common";
import { MiseController } from "./controllers/mise.controller";
import { MiseService } from "./services/mise.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Job } from "./entities/job.entity";
import { JwtModule } from "@nestjs/jwt";
import { Sector } from "./entities/sector.entity";
import { Location } from "./entities/location.entity";

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Job, Sector, Location])
  ],
  controllers: [MiseController],
  providers: [MiseService],
  exports: [MiseService]
})
export class MiseModule {
}
