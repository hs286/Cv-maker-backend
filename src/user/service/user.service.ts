/* eslint-disable prettier/prettier */
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { JobRole } from "src/auth/0auth2.0/entites/jobRole.entity";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { Repository } from "typeorm";
import { UpdateCredentialDto, GetAppliedJobDto } from "../dto";
import { FileSystemService } from "src/utils/file-sytem/file-system.service";
import { FilesService } from "src/files/services/files.service";
import { Role, Role as UserRoles, UserStatus } from "src/auth/0auth2.0/enums";
import { UploadType } from "src/files/enums";
import { LogService } from "src/logger";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "src/globals/responses";
import { API_STATUS } from "src/globals/enums";
// import { GetLocationsDto } from "../dto/get-locations.dto";
// import { Applicant } from "src/application/entities/applicant.entity";
import { TempClient } from "src/auth/0auth2.0/entites/temptClient.entity";
import { ChatRoom } from "src/websocket/chatRoom.entity";
import { Conversation } from "src/conversation/entites/conversation.entity";
import { UserTicket } from "src/ticket/entities/userTicket.entity";
import { CvMakerFile } from "src/cv_maker/entities/cvMaker.entity";
import { Message } from "src/messages/entites/message.entity";
import { Notification } from "src/notifications/entites/notification.entity";
import { OTP } from "src/verification/entities/otp.entity";
import { ScrappedJobEntity } from "src/jobScrapper/entities/jobScrapper.entity";
import { ChatEntity } from "src/websocket/chat.entity";

@ApiTags("user")
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) public userRepository: Repository<User>,
        @InjectRepository(JobRole)
        public jobRoleRepository: Repository<JobRole>,
        @InjectRepository(CVProfile)
        public cvProfileRepository: Repository<CVProfile>,
        // tempClient: TempClient
        @InjectRepository(TempClient)
        public tempClientRepository: Repository<TempClient>,
        // chatRoom
        @InjectRepository(ChatRoom)
        public chatRoomRepository: Repository<ChatRoom>,

        // chat entity
        @InjectRepository(ChatEntity)
        public chatEntityRepository: Repository<ChatEntity>,
        // conversation repository
        @InjectRepository(Conversation)
        public conversationRepository: Repository<Conversation>,
        //  UserTicket service
        @InjectRepository(UserTicket)
        public userTicketRepository: Repository<UserTicket>,

        //  CvMakerFile repository
        @InjectRepository(CvMakerFile)
        public cvMakerFileRepository: Repository<CvMakerFile>,

        //  Message repository
        @InjectRepository(Message)
        public messageRepository: Repository<Message>,

        //  Notification repository
        @InjectRepository(Notification)
        public notificationRepository: Repository<Notification>,

        //  OTP repository
        @InjectRepository(OTP)
        public otpRepository: Repository<OTP>,

        //  ScrappedJobEntity repository
        @InjectRepository(ScrappedJobEntity)
        public scrappedJobRepository: Repository<ScrappedJobEntity>,

        private readonly fileSystemService: FileSystemService,
        private readonly filesService: FilesService,
        private httpService: HttpService,
        private configService: ConfigService,
        private logServive: LogService
    ) {}

    async updateCredential(
        userId: string,
        updateCredentialDto: UpdateCredentialDto
    ) {
        const { newPassword, newEmail, currentPassword } = updateCredentialDto;

        const user = await this.findByUserId(userId);
        const emailAlreadyExists = await this.userRepository.exist({
            where: {
                email: updateCredentialDto.newEmail
            }
        });
        // 1: Updating Email
        if (newEmail && user.email === newEmail && !emailAlreadyExists) {
            throw new BadRequestException(
                "A user with this email already exists."
            );
        } else {
            user.email = newEmail;
        }

        // 2: Updating Password
        if (currentPassword && newPassword) {
            const isValidCurrentPassword = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!isValidCurrentPassword) {
                throw new BadRequestException("Old Password invalid.");
            } else {
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedNewPassword;
            }
        }

        const updatedUser = await this.userRepository.save(user);

        const apiResponse: ApiResponse<User> = {
            status: API_STATUS.SUCCESS,
            message:
                newEmail && currentPassword && newPassword
                    ? "Updated Email & Password"
                    : newEmail
                      ? "Email Updated"
                      : currentPassword && newPassword
                        ? "Password Updated"
                        : "Nothing Updated, No data provided",
            data: updatedUser
        };
        return apiResponse;
    }

    async updateProfileImage(userId: string, file: Express.Multer.File) {
        const user = await this.findByUserId(userId);

        // Deleting Existing File
        await this.fileSystemService.deleteFile(user.profileImageUrl);

        // saving new File
        const uploadedFile = await this.filesService._upload(
            UserRoles.CLIENT,
            UploadType.CONFIG,
            userId,
            file
        );

        user.profileImageUrl = uploadedFile.path;

        return await this.userRepository.save(user);
    }

    async updateCV(userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException("CV is required. Please upload cv");
        }

        const apiKey = await this.configService.get("api.CVReaderApiKey");
        const apiUrl = `${await this.configService.get(
            "api.CVReaderBaseUrl"
        )}/upload`;

        // Convert the Buffer to a Blob
        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        // Create a FormData object to handle file upload
        const formData = new FormData();
        formData.append("file", fileBlob, file.originalname);

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
        };

        const user = await this.userRepository.findOneBy({ userId });
        try {
            user.isCvProcessing = true;
            await this.userRepository.save(user);
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );

            const basicCVDetails = response.data;

            // Step1: Save user's info
            user.isCvProcessing = false;
            user.highestEducation = basicCVDetails.highestEducation;
            user.hasUploadedCV = true;

            // Step2: save cv profile
            let cvProfile = await this.cvProfileRepository.findOneBy({
                user: { userId: userId }
            });
            if (!cvProfile) {
                cvProfile = new CVProfile();
                cvProfile.user = <any>{ userId };
            }
            cvProfile.CVProfileStringified = JSON.stringify(response?.data);
            await this.cvProfileRepository.save(cvProfile);

            //Step3: save career history
            const careerHistory: Array<any> = response?.data?.history;

            //Step4: delete user's existing job roles
            await this.jobRoleRepository.delete({ user: { userId } });

            if (careerHistory?.length > 0) {
                careerHistory.forEach(async (job) => {
                    const jobRole = new JobRole();

                    jobRole.jobTitle = job?.job_title;
                    jobRole.companyName = job?.company_name;
                    jobRole.achievements = JSON.stringify(
                        job?.achievements
                    ).replace(/"NONE"/g, null);
                    jobRole.responsibilities = JSON.stringify(
                        job?.responsibilities
                    ).replace(/"NONE"/g, null);
                    jobRole.additionalDetails = job?.description;
                    jobRole.startDate = job?.years_of_employment?.from;
                    jobRole.endDate = job?.years_of_employment?.to;
                    jobRole.user = <any>{ userId: user.userId };

                    await this.jobRoleRepository.save(jobRole);
                });
            }
            // store user's skills. skills from api response is array of strings. so we stringify it and store in db
            const technicalSkills = response?.data?.technicalSkills;
            if (technicalSkills?.length > 0) {
                user.technicalSkills = JSON.stringify(technicalSkills).replace(
                    /"NONE"/g,
                    null
                );
            }

            const professionalSkills = response?.data?.professionalSkills;
            if (professionalSkills?.length > 0) {
                user.professionalSkills = JSON.stringify(
                    professionalSkills
                ).replace(/"NONE"/g, null);
            }

            // store user's education history. it is an array of objects. we will stringify it and store it.
            const educationHistory = response?.data?.education;
            if (educationHistory?.length > 0) {
                user.education = JSON.stringify(educationHistory).replace(
                    /"NONE"/g,
                    null
                );
            }
            // store user's extra information
            const extraInfo = response?.data?.extra;
            if (extraInfo) {
                user.extras = JSON.stringify(extraInfo).replace(
                    /"NONE"/g,
                    null
                );
            }

            // save the file
            const uploadedFile = await this.filesService._upload(
                UserRoles.CLIENT,
                UploadType.UPLOAD,
                userId,
                file,
                true
            );

            user.cvUrl = uploadedFile.path; //"path":  "uploaded-files/users/0e81116f-c36e-44d0-9fc7-54f8177a70b5/upload/35954bd1-2e91-4a66-9e1d-0d5d0327d5cd.pdf",

            // save updated info in db
            await this.userRepository.save(user);

            return {
                status: 200,
                message: "CV uploaded & profile updated accordingly",
                data: uploadedFile
            };
        } catch (error) {
            this.logServive.error(`UserService:uploadCV ${error}`);
            user.isCvProcessing = false;
            await this.userRepository.save(user);
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${error}`
            );
        }
    }

    async getAppliedJob(getAppliedJobDto: GetAppliedJobDto) {
        const { userId } = getAppliedJobDto;

        await this.findByUserId(userId);

        return await this.jobRoleRepository.find({
            where: { user: { userId } }
        });
    }

    async findByUserId(userId: string) {
        const user = await this.userRepository.findOne({
            where: { userId }
        });

        if (!user) {
            throw new BadRequestException("User not found.");
        }

        return user;
    }

    async updateUserStatus(userId: string, status: UserStatus) {
        const user = await this.userRepository.findOne({
            where: { userId }
        });
        if (!user) {
            throw new NotFoundException("Could not find user: " + userId);
        }
        user.status = status;
        await this.userRepository.save(user);
    }

    async updateUserStripeCustomerId(email: string, customerId: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { email }
            });

            if (!user) {
                throw new Error();
            }

            user.stripeCustomerId = customerId;

            await this.userRepository.save(user);
        } catch (error) {
            this.logServive.error(
                `[UserService.updateUserStripeCustomerId] ${error}`
            );
        }
    }

    async updatePaymentStatus({ stripeCustomerId, paymentStatus }) {
        const user = await this.userRepository.findOne({
            where: {
                stripeCustomerId
            }
        });

        if (!user) {
            throw new BadRequestException("User not found.");
        }

        if (!user?.basket) {
            throw new BadRequestException("No basket found.");
        }

        const basket = JSON.parse(user.basket);

        basket.actualServices = basket?.actualServices?.map(
            (service, index) => {
                if (index === 0) {
                    return {
                        name: service,
                        status: "In Progress"
                    };
                } else {
                    return {
                        name: service,
                        status: "" // 'Pending'
                    };
                }
            }
        );

        basket.paymentStatus = paymentStatus;
        basket.paymentDate = new Date().toISOString();

        user.basket = "";
        user.purchased = JSON.stringify(basket);

        return this.userRepository.save(user);
    }

    async findUserByEmail(email: string) {
        const user = await this.userRepository.findOne({
            where: { email }
        });

        if (!user) {
            throw new BadRequestException("User not found.");
        }

        return user;
    }

    async masterDeleteAllUserDataById(userId: string) {
        // find user if exists
        const user = await this.userRepository.findOne({
            where: {
                userId
            }
        });
        if (!user || user.role.toLowerCase() === Role.ADMIN) {
            throw new NotFoundException("User not found");
        }
        try {
            // delete Chats By UserId
            // await this.deleteChatsByUserId(userId);
            // this.logServive.info("Chat Entity deleted");

            // delete chat_room
            await this.deleteChatRoomByuserId(userId);

            this.logServive.info("Chat Rooms deleted");
            // deleted Temp Client
            await this.deleteTempClient(userId);

            this.logServive.info("Temp client deleted");
            // delete messages by user id
            await this.deleteMessagesByUserId(userId);

            this.logServive.info("Messages deleted");
            // delete conversation
            await this.deleteConversationsByUserId(userId);

            this.logServive.info("Conversations deleted");
            // delete cv maker files ByUserId
            await this.deleteCvMakerFilesByUserId(userId);

            this.logServive.info("Cv Maker Files deleted");
            // delete cv profile by userId
            await this.deleteCVProfileByUserId(userId);

            this.logServive.info("Cv profile deleted");

            // delete files by userId
            await this.filesService.deleteFilesByUserId(userId);

            this.logServive.info("Files deleted");

            // delete job roles
            await this.deleteJobRolesByUserId(userId);

            this.logServive.info("Job roles deleted");

            //  delete notifications by userId
            await this.deleteNotificationsByUserId(userId);

            this.logServive.info("Notificaitons deleted");

            // OTP deleted by userId
            await this.deleteOTPByUserId(userId);
            // scrapped jobs deleted by userId
            await this.deleteScrappedJobsByUserId(userId);

            // delete all data from other tables then lastly delete user
            await this.userRepository.remove(user);

            this.logServive.info("User deleted");

            return { message: "user data deleted successfully" };
        } catch (error) {
            this.logServive.error(
                `UserService:masterDeleteAllUserDataById ${error}`
            );
            throw new InternalServerErrorException(
                `An Error Occured. please try again. Details: ${error}`
            );
        }
    }

    private async deleteChatRoomByuserId(userId: string) {
        // Find chat rooms where the provided userId is associated as either client or admin
        const chatRoomsToDelete = await this.chatRoomRepository
            .createQueryBuilder("chatRoom")
            .where(
                "chatRoom.client.userId = :userId OR chatRoom.admin.userId = :userId",
                { userId }
            )
            .getMany();

        // Delete the found chat rooms
        return await this.chatRoomRepository.remove(chatRoomsToDelete);
    }

    private async deleteTempClient(userId: string) {
        return await this.tempClientRepository.delete({ userId: userId });
    }

    async deleteConversationsByUserId(userId: string) {
        // Find conversations where the provided userId is among the participants
        const conversationsToDelete = await this.conversationRepository
            .createQueryBuilder("conversation")
            .innerJoin("conversation.participants", "participant")
            .where("participant.userId = :userId", { userId })
            .getMany();

        // Delete the found conversations
        return await this.conversationRepository.remove(conversationsToDelete);
    }

    // cvMakerFileRepository

    async deleteCvMakerFilesByUserId(userId: string) {
        return await this.cvMakerFileRepository
            .createQueryBuilder()
            .delete()
            .where("userId = :userId", { userId })
            .execute();
    }

    async deleteCVProfileByUserId(userId: string) {
        return await this.cvProfileRepository.delete({
            user: { userId: userId }
        });
    }

    async deleteJobRolesByUserId(userId: string) {
        return await this.jobRoleRepository.delete({
            user: { userId: userId }
        });
    }

    async deleteMessagesByUserId(userId: string) {
        // Find messages sent by the user with the provided userId
        const messagesToDelete = await this.messageRepository
            .createQueryBuilder("message")
            .leftJoinAndSelect("message.sender", "sender")
            .where("sender.userId = :userId", { userId })
            .getMany();

        // Delete the found messages
        return await this.messageRepository.remove(messagesToDelete);
    }

    async deleteNotificationsByUserId(userId: string) {
        // Find notifications associated with the user with the provided userId
        const notificationsToDelete = await this.notificationRepository.find({
            where: {
                user: { userId: userId }
            }
        });

        // Delete the found notifications
        return await this.notificationRepository.remove(notificationsToDelete);
    }

    async deleteOTPByUserId(userId: string) {
        // Find OTP records associated with the user with the provided userId
        const otpsToDelete = await this.otpRepository.find({
            where: {
                userId: userId
            }
        });

        // Delete the found OTP records
        return await this.otpRepository.remove(otpsToDelete);
    }

    async deleteScrappedJobsByUserId(userId: string) {
        // Find scrapped job records associated with the user with the provided userId
        const scrappedJobsToDelete = await this.scrappedJobRepository.find({
            where: {
                userId: userId
            }
        });

        // Delete the found scrapped job records
        return await this.scrappedJobRepository.remove(scrappedJobsToDelete);
    }

    async deleteChatsByUserId(userId: string): Promise<void> {
        await this.chatEntityRepository
            .createQueryBuilder()
            .delete()
            .where("sender.userId = :userId", { userId })
            .execute();
    }
}
