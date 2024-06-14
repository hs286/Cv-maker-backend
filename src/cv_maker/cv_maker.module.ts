import { forwardRef, Module } from "@nestjs/common";
import { Cv_Maker } from "./entities/cv_maker.entity";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CvMakerService } from "./services/cv_maker.service";
import { CvMakerController } from "./controllers/cv_maker.controller";
import { HttpModule } from "@nestjs/axios";
import { CvMakerFile } from "./entities/cvMaker.entity";
import { FileSystemService } from "src/utils/file-sytem/file-system.service";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { FileSystemModule } from "src/utils/file-sytem/file-sytem.module";
import { Cv_Type } from "../cv_type/entities/cv_type.entity";
import { ProfileModule } from "../profile/profile.module";
import { TempClient } from "../auth/0auth2.0/entites/temptClient.entity";
import { AuthModule } from "../auth/0auth2.0/auth.module";

@Module({
    imports: [
        JwtModule.register({}),
        TypeOrmModule.forFeature([
            Cv_Maker,
            CvMakerFile,
            User,
            Cv_Type,
            TempClient
        ]),
        HttpModule,
        FileSystemModule,
        ProfileModule,
        forwardRef(() => AuthModule)
    ],
    controllers: [CvMakerController],
    providers: [CvMakerService, FileSystemService],
    exports: [CvMakerService]
})
export class CvMakerModule {
}
