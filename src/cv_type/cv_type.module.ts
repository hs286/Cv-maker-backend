import { Module } from "@nestjs/common";
import { Cv_Type } from "./entities/cv_type.entity";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CvTypeService } from "./services/cv_type.service";
import { CvTypeController } from "./controllers/cv_type.controller";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [
        JwtModule.register({}),
        TypeOrmModule.forFeature([Cv_Type]),
        HttpModule
    ],
    controllers: [CvTypeController],
    providers: [CvTypeService],
    exports: [CvTypeService]
})
export class CvTypeModule {
}
