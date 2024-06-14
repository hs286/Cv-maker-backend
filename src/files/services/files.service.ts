import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    StreamableFile
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { createReadStream } from "fs";
import { API_STATUS } from "src/globals/enums";
import { FileSystemService } from "src/utils/file-sytem/file-system.service";
import { GetFilesQueryDto } from "../DTOs";
import { PaginationDTO } from "src/globals/DTOs";
import { File } from "../entities/file.entity";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { UploadType } from "../enums";
import { Role as UserRole } from "src/auth/0auth2.0/enums";
import { LogService } from "src/logger";
import * as process from "node:process";

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File) public fileRepository: Repository<File>,
        @InjectRepository(User) public userRepository: Repository<User>,
        private fileSystemService: FileSystemService,
        private logService: LogService
    ) {
    }

    async userUploadFile(userId: string, file: Express.Multer.File) {
        try {
            const uploadedFile = await this._upload(
                UserRole.CLIENT,
                UploadType.UPLOAD,
                userId,
                file
            );
            return {
                status: API_STATUS.SUCCESS,
                message: "File uploaded Successfully",
                data: uploadedFile
            };
        } catch (err) {
            this.logService.error(`FilesService:userUploadFile ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async adminUploadUserFile(
        uploadedBy: UserRole,
        userId: string,
        file: Express.Multer.File
    ) {
        try {
            const uploadedFile = await this._upload(
                uploadedBy,
                UploadType.UPLOAD,
                userId,
                file
            );
            return {
                status: API_STATUS.SUCCESS,
                message: "File uploaded Successfully",
                data: uploadedFile
            };
        } catch (err) {
            this.logService.error(`FilesService:adminUploadUserFile ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async getFile(fileId: string, userId?: string) {
        try {
            const file = await this._findOne(fileId, userId);
            return {
                status: API_STATUS.SUCCESS,
                message: "Get File Successfully",
                data: file
            };
        } catch (err) {
            this.logService.error(`FilesService:getFile ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async downloadFile(fileId: string, userId?: string) {
        try {
            const file = await this._findOne(fileId, userId);
            const stream = createReadStream(process.cwd() + "/" + file.path);
            return new StreamableFile(stream);
        } catch (err) {
            this.logService.error(`FilesService:downloadFile ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async getFileForAdmin(fileId: string) {
        const file = await this.fileRepository.findOne({
            where: {
                id: fileId
            }
        });
        return file;
    }

    async setFileAsFinal(fileId: string) {
        const file = await this.fileRepository.findOne({
            where: {
                id: fileId
            }
        });
        file.uploadedType = UploadType.FINAL_CV;
        file.isCv = true;
        await this.fileRepository.save(file);
        return file;
    }

    async getFiles(query: GetFilesQueryDto, userId?: string) {
        // check if userId exists
        const userExists = await this.userRepository.exist({
            where: { userId }
        });
        if (!userExists) {
            throw new HttpException(
                "User with this id doesn't exist",
                HttpStatus.NOT_FOUND
            );
            // throw new NotFoundException({
            //   message: "User with this id doesn't exist",
            // });
        }
        try {
            const result = await this._findAllForClient(query, userId);
            return {
                status: API_STATUS.SUCCESS,
                message: "Get Files Successfully",
                data: result.files,
                pagination: result.pagination
            };
        } catch (err) {
            this.logService.error(`FilesService:getFiles ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async getAdminCVFiles(query: GetFilesQueryDto, userId: string) {
        // check if userId exists
        const userExists = await this.userRepository.findOne({
            where: { userId }
        });
        if (!userExists) {
            throw new HttpException(
                "User with this id doesn't exist",
                HttpStatus.NOT_FOUND
            );
        }
        try {
            const result = await this._findAllCVs(query, userId);
            return {
                status: API_STATUS.SUCCESS,
                message: "Get Files Successfully",
                data: result.files,
                pagination: result.pagination
            };
        } catch (err) {
            this.logService.error(`FilesService:getFiles ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async deleteFile(fileId: string, userId?: string) {
        try {
            await this._deleteOne(fileId, userId);
            return {
                status: API_STATUS.SUCCESS,
                message: "File Deleted Successfully"
            };
        } catch (err) {
            this.logService.error(`FilesService:deleteFile ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async _upload(
        uploadedBy: UserRole,
        uploadType: UploadType,
        userId: string,
        file: Express.Multer.File,
        isCv?: boolean
    ) {
        try {
            // check if userId exists
            const userExists = await this.userRepository.exist({
                where: { userId }
            });

            if (!userExists) {
                throw new BadRequestException({
                    message: "User with this id doesn't exist"
                });
            }

            const fileDestination = `${userId}/${UploadType.UPLOAD}`;
            const fileExtension = file.originalname.substring(
                file.originalname.lastIndexOf(".") + 1
            );

            const res = await this.fileSystemService.processFile(
                fileDestination,
                fileExtension,
                file.buffer
            );

            console.log("File processed.");

            const newFile = new File();

            newFile.path = res.filePath;
            newFile.name = file.originalname;
            newFile.fileExtension = fileExtension;
            newFile.mimeType = file.mimetype;
            newFile.uploadedType = uploadType;
            newFile.uploadedBy = uploadedBy;
            newFile.user = { userId: userId } as any;
            if (isCv) newFile.isCv = true;

            const data = await this.fileRepository.save(newFile);
            console.log("File saved against user: ", userId);

            return data;
        } catch (err) {
            console.error("Error File upload: ", err);
            if (err instanceof BadRequestException) {
                throw err;
            }
            throw new InternalServerErrorException(
                `An Error Occurred. please try again. Details: ${err}`
            );
        }
    }

    async _findAllCVs(query: GetFilesQueryDto, userId: string) {
        try {
            // pagination stuff
            const skip = query.limit * (query.page - 1);
            const take = query.limit;

            Object.keys(new PaginationDTO()).forEach((key) => {
                delete query[key];
            });

            // Find Logic
            let findObj: Record<string, any> = {};
            findObj.user = { userId };
            findObj.uploadedType = In([
                UploadType.UPLOAD,
                UploadType.GENERATED_CV,
                UploadType.CV_DRAFT,
                UploadType.FINAL_CV
            ]);
            findObj = { ...findObj, ...query };

            console.log("findObj", findObj);

            const totalFiles = await this.fileRepository.count({
                where: findObj
            });

            let files = await this.fileRepository.find({
                where: findObj,
                relations: !userId && { user: true },
                skip,
                take,
                select: {
                    user: {
                        userId: true
                    }
                }
            });

            files = files.filter(async (file) => {
                if (!(await this.fileSystemService.checkPathExist(file.path))) {
                    await this.fileRepository.delete({ id: file.id });
                    return false;
                }
                return true;
            });

            return {
                files,
                pagination: {
                    page: skip / take + 1,
                    limit: take,
                    total: totalFiles
                }
            };
        } catch (err) {
            this.logService.error(`FilesService:_findAll ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async _findAll(query: GetFilesQueryDto, userId?: string) {
        try {
            // pagination stuff
            const skip = query.limit * (query.page - 1);
            const take = query.limit;
            Object.keys(new PaginationDTO()).forEach((key) => {
                delete query[key];
            });

            // Find Logic
            let findObj: Record<string, any> = {};
            if (userId) findObj.user = { userId };
            findObj = { ...findObj, ...query };

            if (query.uploadedBy) {
                findObj.uploadedBy = In(query.uploadedBy.split(","));
            }
            const totalFiles = await this.fileRepository.count({
                where: <any>findObj
            });
            let files = await this.fileRepository.find({
                where: findObj,
                relations: !userId && { user: true },
                skip,
                take,
                select: {
                    user: {
                        userId: true
                    }
                }
            });

            files = files.filter(async (file) => {
                if (!(await this.fileSystemService.checkPathExist(file.path))) {
                    await this.fileRepository.delete({ id: file.id });
                    return false;
                }
                return true;
            });

            return {
                files,
                pagination: {
                    page: skip / take + 1,
                    limit: take,
                    total: totalFiles
                }
            };
        } catch (err) {
            this.logService.error(`FilesService:_findAll ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async _findAllForClient(query: GetFilesQueryDto, userId?: string) {
        try {
            // pagination stuff
            const skip = query.limit * (query.page - 1);
            const take = query.limit;
            Object.keys(new PaginationDTO()).forEach((key) => {
                delete query[key];
            });

            // Find Logic
            let findObj: Record<string, any> = {};

            findObj.uploadedType = In([UploadType.UPLOAD, UploadType.FINAL_CV]);

            if (userId) findObj.user = { userId };
            findObj = { ...findObj, ...query };

            if (query.uploadedBy) {
                findObj.uploadedBy = In(query.uploadedBy.split(","));
            }

            const totalFiles = await this.fileRepository.count({
                where: <any>findObj
            });
            let files = await this.fileRepository.find({
                where: findObj,
                relations: !userId && { user: true },
                skip,
                take,
                select: {
                    user: {
                        userId: true
                    }
                }
            });

            files = files.filter(async (file) => {
                if (!(await this.fileSystemService.checkPathExist(file.path))) {
                    await this.fileRepository.delete({ id: file.id });
                    return false;
                }
                return true;
            });

            return {
                files,
                pagination: {
                    page: skip / take + 1,
                    limit: take,
                    total: totalFiles
                }
            };
        } catch (err) {
            this.logService.error(`FilesService:_findAll ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async _findOne(fileId: string, userId?: string) {
        try {
            const findObj: Record<string, any> = { id: fileId };
            if (userId) findObj.user = { userId };
            const file = await this.fileRepository.findOne({
                where: findObj,
                relations: !userId && { user: true },
                select: {
                    user: {
                        userId: true
                    }
                }
            });

            if (!file) {
                throw new NotFoundException({
                    status: 404,
                    message: "file not found"
                });
            }

            if (!(await this.fileSystemService.checkPathExist(file.path))) {
                await this.fileRepository.delete({ id: file.id });
                throw new NotFoundException({
                    status: 404,
                    message: "file not found"
                });
            }

            return file;
        } catch (err) {
            this.logService.error(`FilesService:_findOne ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async _deleteOne(fileId: string, userId?: string) {
        try {
            const findObj: Record<string, any> = { id: fileId };
            if (userId) findObj.user = { userId };
            const file = await this.fileRepository.findOneBy(findObj);
            if (!file) {
                throw new NotFoundException({
                    status: 404,
                    message: "File not found"
                });
            }

            const res = await this.fileRepository.delete(findObj);

            await this.fileSystemService.deleteFile(file.path);
        } catch (err) {
            this.logService.error(`FilesService:_deleteOne ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async deleteFilesByUserId(userId: string) {
        return await this.fileRepository
            .createQueryBuilder()
            .delete()
            .where("userId = :userId", { userId })
            .execute();
    }
}
