import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesService } from "./services/files.service";
import { FilesController } from "./controllers/files.controller";
import { File } from "./entities/file.entity";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { FileSystemModule } from "src/utils/file-sytem/file-sytem.module";

@Module({
  imports: [TypeOrmModule.forFeature([File, User]), FileSystemModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {
}
