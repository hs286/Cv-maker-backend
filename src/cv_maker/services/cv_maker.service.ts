// cv-maker.service.ts
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FileSystemService } from "src/utils/file-sytem/file-system.service";
import { CreateCvMakerDto } from "../DTOs";
import { Cv_Maker } from "../entities/cv_maker.entity";
import { HttpService } from "@nestjs/axios";
import { Role } from "src/auth/0auth2.0/enums";
import { LogService } from "src/logger";
import { API_STATUS } from "src/globals/enums";
import { CvMakerFile } from "../entities/cvMaker.entity";
import { UploadType } from "src/files/enums";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { Repository } from "typeorm";
import { firstValueFrom } from "rxjs";
import * as process from "process";
import { CvMakerAdminUploadUserFileDTO } from "../DTOs/uploadCvMakerDto";
import { Cv_Type } from "../../cv_type/entities/cv_type.entity";
import { ProfileService } from "../../profile/services/profile.service";
import { TempClient } from "../../auth/0auth2.0/entites/temptClient.entity";
import { AuthService } from "../../auth/0auth2.0/services/auth.service";

@Injectable()
export class CvMakerService {
    constructor(
        @InjectRepository(Cv_Maker)
        private cvMakerRepository: Repository<Cv_Maker>,
        @InjectRepository(CvMakerFile)
        private cvMakerFileRepository: Repository<CvMakerFile>,
        @InjectRepository(Cv_Type)
        private cvTypeRepository: Repository<Cv_Type>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(TempClient)
        private tempClientRepository: Repository<TempClient>,
        private fileSystemService: FileSystemService,
        private logService: LogService,
        private httpService: HttpService,
        private profileService: ProfileService,
        private authService: AuthService
    ) {}

    async createCvMaker(createCvMakerDto: CreateCvMakerDto): Promise<Cv_Maker> {
        // Extract the name and api_name from the DTO
        const { name, api_name } = createCvMakerDto;

        // Check if a Cv_Maker with the same name already exists
        const existingNameCvMaker = await this.cvMakerRepository.findOne({
            where: { name }
        });

        // Check if a Cv_Maker with the same api_name already exists
        const existingApiNameCvMaker = await this.cvMakerRepository.findOne({
            where: { api_name }
        });

        // If a Cv_Maker with the same name already exists, throw an error
        if (existingNameCvMaker) {
            throw new BadRequestException("Name already exists");
        }

        // If a Cv_Maker with the same api_name already exists, throw an error
        if (existingApiNameCvMaker) {
            throw new BadRequestException("API name already exists");
        }

        // If no Cv_Maker with the same name and api_name exists, create a new one
        const cvMaker = this.cvMakerRepository.create(createCvMakerDto);

        // Save the newly created Cv_Maker entity to the database

        const PROMPT_API_URL = process.env.PROMPT_API_URL;
        const PROMPT_API_KEY = process.env.PROMPT_API_KEY;

        const headers = { "api-key": PROMPT_API_KEY };

        try {
            const formData = new FormData();

            formData.append("name", cvMaker.api_name);
            formData.append("instructions", cvMaker.command);

            // Save into prompt
            const response = await firstValueFrom(
                this.httpService.post(
                    `${PROMPT_API_URL}/make-prompt`,
                    formData,
                    {
                        headers
                    }
                )
            );

            console.log(
                "Response from make-prompt api create command",
                response.data
            );

            await this.cvMakerRepository.save(cvMaker);

            return response.data;
        } catch (error) {
            console.error(
                "prompt api make command error",
                error.response?.status,
                error.response?.data ?? error
            );
            throw new BadRequestException(
                "prompt api is not working.",
                error.response?.data
            );
        }
    }

    async updateCommand(
        name: string,
        api_name: string,
        command: string,
        content: string
    ): Promise<Cv_Maker> {
        const cvMaker = await this.cvMakerRepository.findOne({
            where: { api_name }
        });
        if (!cvMaker) {
            throw new NotFoundException(`${api_name} is not found`);
        }
        cvMaker.name = name;
        cvMaker.command = command;
        cvMaker.content = content;

        const PROMPT_API_URL = process.env.PROMPT_API_URL;
        const PROMPT_API_KEY = process.env.PROMPT_API_KEY;

        const headers = { "api-key": PROMPT_API_KEY };

        const formData = new FormData();

        formData.append("name", cvMaker.api_name);
        formData.append("instructions", cvMaker.command);

        // Save into prompt
        const response = await firstValueFrom(
            this.httpService.post(`${PROMPT_API_URL}/make-prompt`, formData, {
                headers
            })
        );
        if (response.data) {
            this.cvMakerRepository.save(cvMaker);
        }
        return response.data;
    }

    async getAllCvMakers(): Promise<Cv_Maker[]> {
        try {
            const cvMakers = await this.cvMakerRepository.find();
            return cvMakers;
        } catch (error) {
            throw new InternalServerErrorException(
                `An Error Occurred while fetching CV Makers: ${error}`
            );
        }
    }

    async deleteCvMaker(api_name: string): Promise<any> {
        const cvMaker = await this.cvMakerRepository.findOne({
            where: { api_name }
        });

        if (cvMaker) {
            const PROMPT_API_URL = process.env.PROMPT_API_URL;
            const PROMPT_API_KEY = process.env.PROMPT_API_KEY;
            const headers = { "api-key": PROMPT_API_KEY };
            try {
                const formData = new FormData();

                formData.append("name", cvMaker.api_name);

                const response = await firstValueFrom(
                    this.httpService.post(
                        `${PROMPT_API_URL}/delete-prompt`,
                        formData,
                        {
                            headers
                        }
                    )
                );
                if (response.data) {
                    const result = await this.cvMakerRepository.delete(
                        cvMaker.id
                    );
                    if (result.affected === 0) {
                        throw new BadRequestException(
                            `${api_name} is not exists`
                        );
                    }
                }
                return response.data;
            } catch (error) {
                throw new BadRequestException("prompt api is not working");
            }
        } else {
            throw new BadRequestException(`${api_name} is not exists`);
        }
    }

    async adminUploadCvMakerFile(
        uploadedBy: Role,
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
            this.logService.error(
                `CvMakerService:adminUploadCvMakerFile ${err}`
            );
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async _upload(
        uploadedBy: Role,
        uploadType: UploadType,
        userId: string,
        file: Express.Multer.File,
        isCv?: boolean
    ) {
        try {
            const fileDestination = `${userId}/${UploadType.UPLOAD}`;
            const fileExtension = file.originalname.substring(
                file.originalname.lastIndexOf(".") + 1
            );
            const res = await this.fileSystemService.processFile(
                fileDestination,
                fileExtension,
                file.buffer
            );
            const newFile = new CvMakerFile();
            newFile.path = res.filePath;
            newFile.name = file.originalname;
            newFile.fileExtension = fileExtension;
            newFile.mimeType = file.mimetype;
            newFile.uploadedType = uploadType;
            newFile.uploadedBy = uploadedBy;
            newFile.user = { userId: userId } as any;
            return await this.cvMakerFileRepository.save(newFile);
        } catch (err) {
            if (err instanceof BadRequestException) {
                throw err;
            }
            this.logService.error(`FilesService:_upload ${err}`);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${err}`
            );
        }
    }

    async fetchInfoByCvMaker(
        role: Role,
        body: CvMakerAdminUploadUserFileDTO,
        file: Express.Multer.File,
        save: boolean
    ) {
        let data;

        const temptClient = await this.tempClientRepository.findOne({
            where: {
                userId: body.userId
            }
        });

        if (temptClient) {
            temptClient.promptApiBrokenFields = null;
            await this.tempClientRepository.save(temptClient);
        }

        if (save) {
            const where = {};
            where[body.cvType] = true;
            const contentTypes = await this.cvTypeRepository.find({
                where: where
            });
            const promises = [];
            const workHistoryRelatedSections = [
                "workHistory",
                "role",
                "responsibilities",
                "achievements"
            ];
            const workMakerDetail: { name: string; section: string }[] = [];
            for (let i = 0; i < contentTypes.length; i++) {
                if (
                    workHistoryRelatedSections.includes(contentTypes[i].section)
                ) {
                    workMakerDetail.push({
                        section: contentTypes[i].section,
                        name: contentTypes[i].name
                    });
                } else {
                    const response = this.updateUserInfoWithPromptApi(
                        {
                            ...body,
                            name: contentTypes[i].name,
                            section: contentTypes[i].section
                        },
                        file
                    );
                    promises.push(response);
                }
            }

            if (workMakerDetail.length)
                promises.push(
                    this.fetchWorkHistoryRelatedInfo(
                        body,
                        file,
                        workMakerDetail
                    )
                );

            await Promise.all(promises);

            return await this.authService.fetchUserByIdForIntraCrm(body.userId);
        } else {
            const response = await this.usePromptAPI(body, file);
            data = response.data;
        }

        if (file && data) {
            await this.adminUploadCvMakerFile(role, body.userId, file);
        }

        return data;
    }

    private async updateUserInfoWithPromptApi(
        body: CvMakerAdminUploadUserFileDTO,
        file: Express.Multer.File
    ) {
        const response = await this.usePromptAPI(body, file);

        let temp_client = await this.tempClientRepository.findOne({
            where: {
                userId: body.userId
            }
        });

        if (!temp_client) {
            temp_client = new TempClient();
            temp_client.userId = body.userId;
        }

        const data = response.data?.result;

        const promptApiBrokenFields = temp_client.promptApiBrokenFields
            ? JSON.parse(temp_client.promptApiBrokenFields)
            : [];

        if (data) {
            if (body.section === "personalInfo") {
                temp_client.firstName = data.firstName ?? temp_client.firstName;
                temp_client.lastName = data.lastName ?? temp_client.lastName;
                temp_client.phone = data.phone ?? temp_client.phone;
                temp_client.email = data.email ?? temp_client.email;
                temp_client.location = data.location ?? temp_client.location;
                temp_client.portfolio = data.portfolio ?? temp_client.portfolio;
                temp_client.profileLink =
                    data.profileLink ?? temp_client.profileLink;
                temp_client.profileSummary =
                    data.profileSummary ?? temp_client.profileSummary;
                // await this.profileService.updatePersonalInfo(body.userId, data);
            } else {
                const parsedData = this.parseStringFromArray(data);
                temp_client[body.section] = parsedData
                    ? parsedData
                    : temp_client[body.section];
                if (!temp_client[body.section])
                    promptApiBrokenFields.push(body.section);
            }

            temp_client.promptApiBrokenFields = JSON.stringify(
                promptApiBrokenFields
            );
            await this.tempClientRepository.save(temp_client);
        } else {
            console.warn(
                "No updatable data found from prompt api",
                response.data
            );
        }

        return data;
    }

    private async fetchWorkHistoryRelatedInfo(
        body: CvMakerAdminUploadUserFileDTO,
        file: Express.Multer.File,
        sections: any[]
    ) {
        const workHistoryResponse = await this.usePromptAPI(
            {
                ...body,
                section: "workHistory"
            },
            file
        );

        const workHistory = workHistoryResponse.data.result ?? [];

        const user = await this.userRepository.findOne({
            where: {
                userId: body.userId
            }
        });

        for (let i = 0; i < workHistory.length; i++) {
            for (let j = 0; j < sections.length; j++) {
                if (sections[j].name !== "workHistory") {
                    const response = await this.usePromptAPI(
                        {
                            ...body,
                            name: sections[j].name,
                            section: sections[j].section,
                            jobTarget: workHistory[i].jobTitle,
                            content: JSON.stringify(
                                workHistory[i][sections[j].section]
                            )
                        },
                        null
                    );

                    if (sections[j].section === "role") {
                        if (typeof response.data?.result === "string") {
                            workHistory[i].role = response.data?.result;
                        }
                    } else if (Array.isArray(response.data?.result)) {
                        workHistory[i][sections[j].section] =
                            response.data?.result;
                    }
                }
            }
        }

        let temp_client = await this.tempClientRepository.findOne({
            where: {
                userId: body.userId
            }
        });
        if (!temp_client) {
            temp_client = new TempClient();
            temp_client.userId = body.userId;
        }

        const parsedData = this.parseStringFromArray(workHistory);
        temp_client.workHistory = parsedData
            ? parsedData
            : temp_client.workHistory;

        const promptApiBrokenFields = temp_client.promptApiBrokenFields
            ? JSON.parse(temp_client.promptApiBrokenFields)
            : [];

        if (!parsedData) promptApiBrokenFields.push(body.section);

        temp_client.promptApiBrokenFields = JSON.stringify(
            promptApiBrokenFields
        );
        await this.tempClientRepository.save(temp_client);
    }

    private parseStringFromArray(value: []): string {
        try {
            return Array.isArray(value) && value.length > 0
                ? JSON.stringify(value)
                : null;
        } catch (error) {
            return null;
        }
    }

    private async usePromptAPI(
        body: CvMakerAdminUploadUserFileDTO,
        file?: Express.Multer.File
    ) {
        const PROMPT_API_URL = `${process.env.PROMPT_API_URL}/use-prompt`;
        const PROMPT_API_KEY = process.env.PROMPT_API_KEY;

        const fileBlob = file
            ? new Blob([file.buffer], { type: file.mimetype })
            : null;

        const formData = new FormData();

        formData.append("name", body.name);
        formData.append("jobTarget", body.jobTarget);
        formData.append("content", body.content);
        if (fileBlob) {
            formData.append("file", fileBlob, file.originalname);
        }

        const headers = {
            "Content-Type": "multipart/form-data",
            "api-key": PROMPT_API_KEY
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(PROMPT_API_URL, formData, {
                    headers
                })
            );
            console.log(
                "Response Prompt API: ",
                body.name,
                body.jobTarget,
                JSON.stringify(response?.data)
            );
            return response;
        } catch (err) {
            console.log(
                "Failed to use prompt api. Error: ",
                body.name,
                err.response?.status,
                err.response?.data
            );
            return {
                data: {
                    result: []
                }
            };
        }
    }
}
