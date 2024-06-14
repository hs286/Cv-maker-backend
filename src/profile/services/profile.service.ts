import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { ApiResponse } from "src/globals/responses";
import { API_STATUS } from "src/globals/enums";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { JobRole } from "src/auth/0auth2.0/entites/jobRole.entity";
import { CVProfile } from "../entities/CVProfile.entity";
import { LogService } from "src/logger";
import { UpdatePersonalInfoDto } from "../DTOs/updatePersonalInfo.dto";
import { UpdateTrainingsDto } from "../DTOs/updateTrainings.dto";
import { UpdateCertificatesDto } from "../DTOs/updateCertificates.dto";
import { UpdateVolunteeringDto } from "../DTOs/updateVolunteering.dto";
import { UpdateJobTargetsDto } from "../DTOs/updateJobTargets.dto";
import { EmailSendingService } from "../../emails/services/email.service";
import * as process from "process";
import { Role as UserRole, Role } from "../../auth/0auth2.0/enums";
import { JwtService } from "@nestjs/jwt/dist";
import {
    AwardDTO,
    EducationDTO,
    MembershipDTO,
    PatentDTO,
    ProjectDTO,
    PublicationDTO,
    UserProfileUpdateDTO,
    WorkHistoryDTO
} from "../DTOs/updateProfile.dto";
import { TempClient } from "../../auth/0auth2.0/entites/temptClient.entity";
import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    ShadingType,
    TextRun
} from "docx";
import { convertClientStringToJson } from "../../utils/helperFunctions";
import { FilesService } from "../../files/services/files.service";
import { UploadType } from "../../files/enums";
import { GetFilesQueryDto } from "../../files/DTOs";
import { ServicesService } from "../../services/services/services.service";
import { VerificationService } from "../../verification/services/verification.service";

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(User) public userRepository: Repository<User>,
        @InjectRepository(JobRole)
        public jobRoleRepository: Repository<JobRole>,
        @InjectRepository(TempClient)
        public tempClientRepository: Repository<TempClient>,
        @InjectRepository(CVProfile)
        public cvProfileRepository: Repository<CVProfile>,
        private httpService: HttpService,
        private configService: ConfigService,
        private servicesService: ServicesService,
        private logService: LogService,
        private emailSendingService: EmailSendingService,
        private verificationService: VerificationService,
        private jwtService: JwtService,
        private fileService: FilesService
    ) {
    }

    async updateJobTargets(userId: string, dto: UpdateJobTargetsDto) {
        try {
            const user = await this.userRepository.findOne({
                where: {
                    userId: userId
                }
            });

            if (!user) {
                throw new NotFoundException("User not found");
            }

            user.jobTarget1 = dto.jobTarget1;
            user.jobSector = dto.jobSector;

            user.targetRole = dto.jobTarget1;
            user.sector = dto.jobSector;

            await this.userRepository.save(user);
        } catch (error) {
            this.logService.error(`[updateJobTargets] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update user profile. Reason: ${error}`
            );
        }
    }

    /**
     * The function generates a profile summary for a user by sending a file to an external API and
     * saving the generated summary in the user's profile.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of the user for whom the profile summary is being generated. It is used to find the user in the
     * database.
     * @param file - The `file` parameter is of type `Express.Multer.File`, which is an interface
     * provided by the Multer middleware for handling file uploads in Express.js. It represents a file
     * that has been uploaded by the user.
     * @returns a Promise that resolves to an ApiResponse object.
     */
    async generateProfileSummary(
        userId: string,
        file: Express.Multer.File
    ): Promise<ApiResponse> {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });
        if (!user) {
            throw new NotFoundException("No such user found");
        }
        if (!file) {
            throw new BadRequestException("File not found");
        }
        const apiKey = await this.configService.get("api.CVReaderApiKey");
        const apiUrl = `${await this.configService.get(
            "api.CVReaderBaseUrl"
        )}/get-profile-summary`;

        // Convert the Buffer to a Blob
        const fileBlob = new Blob([file?.buffer], { type: file?.mimetype });

        // Create a FormData object to handle file upload
        const formData = new FormData();
        formData.append("file", fileBlob, file?.originalname);

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
        };

        try {
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );

            if (response?.data?.summary) {
                user.profileSummary = response?.data?.summary;
                await this.userRepository.save(user);
                return {
                    status: API_STATUS.SUCCESS,
                    message: "Profile summary generated successfully",
                    data: {
                        profileSummary: response.data.summary
                    }
                };
            } else {
                return {
                    status: API_STATUS.SUCCESS,
                    message: "profile summary insignificant",
                    data: {
                        profileSummary:
                            response?.data?.summary || "Unable to get summary."
                    }
                };
            }
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                "An Error Occurred. please try again"
            );
        }
    }

    private async checkUserAndProfile(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });

        const cvProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return {
            user,
            cvProfile
        };
    }

    private async checkUserExists(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return {
            user
        };
    }

    private async getCvProfileByUserId(userId: string) {
        const cvProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });
        return cvProfile;
    }

    async updatePersonalInfo(
        userId: string,
        dto: UpdatePersonalInfoDto,
        performer: Role
    ): Promise<ApiResponse> {
        const { user } = await this.checkUserExists(userId);

        try {
            let emailOrPhoneExists = false;
            const existingChecks = [];
            let updateEmail = false;
            let updatePhone = false;

            if (dto.email && dto.email !== user.email) {
                existingChecks.push({ email: dto.email, userId: Not(userId) });
                updateEmail = true;
                if (performer === Role.CLIENT) {
                    dto.tempEmail = dto.email;
                    dto.email = user.email;
                    dto.isEmailVerified = false;
                    // send email to the user except the updater is an admin
                    // const secret = await this.generateSecret(userId, "expire");
                    // const verificationLink = `${process.env.CLIENT_CRM_FRONTEND_BASE_URL}/auth/verify-email-change?code=${secret}`;
                    // this.emailSendingService.sendEmailVerification(
                    //     dto.tempEmail,
                    //     user.firstName + " " + user.lastName,
                    //     verificationLink
                    // );
                    // this.emailSendingService.sendEmailVerificationOTPCode()
                    this.verificationService.sendEmailOTPCode(
                        userId,
                        dto.tempEmail
                    );
                }
            }

            if (dto.phone && dto.phone !== user.phone) {
                existingChecks.push({ phone: dto.phone, userId: Not(userId) });
                updatePhone = true;
                if (performer === Role.CLIENT) {
                    dto.tempPhone = dto.phone;
                    dto.phone = user.phone;
                    dto.isPhoneVerified = true;
                }
                this.verificationService.sendSmsOTPCode(userId, dto.tempPhone);
            }

            if (existingChecks.length) {
                emailOrPhoneExists = await this.userRepository.exist({
                    where: existingChecks
                });
            }

            if (emailOrPhoneExists) {
                throw new BadRequestException(
                    "A user with this email or phone number already exists."
                );
            }

            await this.userRepository.update({ userId }, dto);

            let cvProfile = await this.getCvProfileByUserId(userId);

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.info = {
                first_name: dto.firstName,
                last_name: dto.lastName,
                email: dto.email,
                phoneNumber: dto.phone,
                city: dto.location
            };
            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);

            return {
                status: API_STATUS.SUCCESS,
                message: `User updated successfully ${updateEmail ? `and a confirmation email is send to the new email address` : ""} ${updatePhone ? " & otp is send to new phone number" : ""}`
            };
        } catch (error) {
            this.logService.error(`[updatePersonalInfo] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update personal info. Reason: ${error}`
            );
        }
    }

    async updateWorkHistory(
        userId: string,
        dto: WorkHistoryDTO[]
    ): Promise<void> {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Work history must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        //  when work history is updated use hasUploaded CV update flag by admin
        user.hasUploadedCV = true;

        // save updated info in db
        await this.userRepository.save(user);

        try {
            await this.jobRoleRepository.delete({ user: { userId } });

            console.log("Deleted job role for userID: ", userId);

            const jobRoles = dto.map(
                (item) =>
                    <JobRole>{
                        achievements: JSON.stringify(item.achievements),
                        companyName: item.companyName,
                        endDate: item.endDate,
                        jobTitle: item.jobTitle,
                        responsibilities: JSON.stringify(item.responsibilities),
                        startDate: item.startDate,
                        role: item.role,
                        user: {
                            userId
                        }
                    }
            );

            await this.jobRoleRepository.save(jobRoles);

            console.log("Updated Job Roles");

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);

            parsedCV.history = [];

            dto.forEach((work) => {
                parsedCV.history.push({
                    job_title: work.jobTitle,
                    company_name: work.companyName,
                    years_of_employment: {
                        from: work.startDate,
                        to: work.endDate
                    },
                    achievements: work.achievements,
                    responsibilities: work.responsibilities
                });
            });

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);

            await this.cvProfileRepository.save(cvProfile);

            console.log("Saved Cv Profile");
        } catch (error) {
            this.logService.error(`[updateWorkHistory] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update work history. Reason: ${error}`
            );
        }
    }

    async updateEducationHistory(
        userId: string,
        dto: EducationDTO[]
    ): Promise<void> {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Education history must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const strEducation = JSON.stringify(dto);
            user.education = strEducation;

            await this.userRepository.update(
                { userId },
                { education: strEducation }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);

            parsedCV.education = [];

            dto.forEach((edu) => {
                parsedCV.education.push({
                    education_level: edu.educationLevel,
                    name_of_institution: edu.institutionName,
                    years_of_employment: {
                        from: edu.startDate,
                        to: edu.endDate
                    }
                });
            });

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);

            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[updateEducationHistory] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update education history. Reason: ${error}`
            );
        }
    }

    async updateTrainings(userId: string, dto: UpdateTrainingsDto[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Trainings must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.training = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.training = [];

            dto.forEach((training) => {
                parsedCV.extra.training.push({
                    name: training.title,
                    institution_name: training.institutionName,
                    years_of_employment: {
                        from: training.startDate,
                        to: training.endDate
                    }
                });
            });

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[updateTrainings] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update trainings. Reason: ${error}`
            );
        }
    }

    async updateCertificates(userId: string, dto: UpdateCertificatesDto[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Certificates must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.certificates = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.certificates = dto;

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[updateCertificates] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update certificates. Reason: ${error}`
            );
        }
    }

    async updateTechnicalSkills(userId: string, skills: string[]) {
        if (!Array.isArray(skills)) {
            throw new BadRequestException("Skills must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            await this.userRepository.update(
                { userId },
                { technicalSkills: JSON.stringify(skills) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.skills = skills;

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[updateSkills] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update technicalSkills. Reason: ${error}`
            );
        }
    }

    async updateProfessionalSkills(userId: string, skills: string[]) {
        if (!Array.isArray(skills)) {
            throw new BadRequestException("Skills must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            await this.userRepository.update(
                { userId },
                { professionalSkills: JSON.stringify(skills) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.skills = skills;

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[professionalSkills] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update professionalSkills. Reason: ${error}`
            );
        }
    }

    async updateAwards(userId: string, dto: AwardDTO[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Awards must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.awards = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.awards = [];

            dto.forEach((awd) => {
                parsedCV.extra.awards.push({
                    name_of_award: awd.title,
                    issuer: awd.institution
                });
            });

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            console.trace(error);
            this.logService.error(`Failed to update awards. Reason: ${error}`);

            throw new InternalServerErrorException(
                `Failed to update awards. Reason: ${error}`
            );
        }
    }

    async updateVolunteering(userId: string, dto: UpdateVolunteeringDto[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Volunteering must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.volunteering_experience = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.volunteering_experience = dto;

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[updateVolunteering] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update volunteering. Reason: ${error}`
            );
        }
    }

    async updatePublications(userId: string, dto: PublicationDTO[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("Publication must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.publications = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.publications = [];

            dto.forEach((pub) => {
                parsedCV.extra.publications.push({
                    publication_title: pub.title,
                    organisation: pub.publisher
                });
            });

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[Update Publications] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update Publications. Reason: ${error}`
            );
        }
    }

    async updateMemberships(userId: string, dto: MembershipDTO[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("MembershipDTO must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.memberships_and_assosiations = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.memberships_and_assosiations = [];

            dto.forEach((mem) => {
                parsedCV.extra.memberships_and_assosiations.push({
                    membership_name: mem.name,
                    organisation_name: mem.issuer,
                    year: `${mem.startDate} - ${mem.endDate}`
                });
            });

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[Update Membership] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update Membership. Reason: ${error}`
            );
        }
    }

    async updatePatents(userId: string, dto: PatentDTO[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("MembershipDTO must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.patents = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.patents = dto;

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[Update Membership] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update Membership. Reason: ${error}`
            );
        }
    }

    async updateProjects(userId: string, dto: ProjectDTO[]) {
        if (!Array.isArray(dto)) {
            throw new BadRequestException("MembershipDTO must be an array");
        }

        let { user, cvProfile } = await this.checkUserAndProfile(userId);

        try {
            const userExtras = JSON.parse(user.extras) || {};

            userExtras.key_projects = dto;

            await this.userRepository.update(
                { userId },
                { extras: JSON.stringify(userExtras) }
            );

            if (!cvProfile) {
                console.warn("There was no cv profile for this client.");
                cvProfile = new CVProfile();
                cvProfile.CVProfileStringified = JSON.stringify({});
                cvProfile.user = <any>{ userId: user.userId };
            }

            const parsedCV = JSON.parse(cvProfile.CVProfileStringified);
            parsedCV.extra = parsedCV.extra || {};
            parsedCV.extra.key_projects = dto;

            cvProfile.CVProfileStringified = JSON.stringify(parsedCV);
            await this.cvProfileRepository.save(cvProfile);
        } catch (error) {
            this.logService.error(`[Update Membership] ${error}`);

            throw new InternalServerErrorException(
                `Failed to update Membership. Reason: ${error}`
            );
        }
    }

    async updateUserProfile(
        userId: string,
        formData: UserProfileUpdateDTO,
        publish: boolean
    ) {
        let tempClient = await this.tempClientRepository.findOne({
            where: {
                userId: userId
            }
        });

        if (!publish) {
            if (!tempClient) {
                tempClient = new TempClient();
            }

            tempClient = new TempClient();
            tempClient.userId = userId;
            tempClient.firstName = formData.firstName;
            tempClient.lastName = formData.lastName;
            tempClient.phone = formData.phone;
            tempClient.email = formData.email;
            tempClient.location = formData.location;
            tempClient.portfolio = formData.portfolio;
            tempClient.profileLink = formData.profileLink;
            tempClient.profileSummary = formData.profileSummary;
            tempClient.workHistory = JSON.stringify(formData.workHistory);
            tempClient.educations = JSON.stringify(formData.educations);
            tempClient.trainings = JSON.stringify(formData.trainings);
            tempClient.certificates = JSON.stringify(formData.certificates);
            tempClient.volunteerings = JSON.stringify(formData.volunteerings);
            tempClient.publications = JSON.stringify(formData.publications);
            tempClient.projects = JSON.stringify(formData.projects);
            tempClient.memberships = JSON.stringify(formData.memberships);
            tempClient.patents = JSON.stringify(formData.patents);
            tempClient.awards = JSON.stringify(formData.awards);
            tempClient.technicalSkills = JSON.stringify(
                formData.technicalSkills
            );
            tempClient.professionalSkills = JSON.stringify(
                formData.professionalSkills
            );

            await this.tempClientRepository.save(tempClient);
        } else {
            if (
                formData.firstName ||
                formData.lastName ||
                formData.phone ||
                formData.email ||
                formData.location ||
                formData.postCode ||
                formData.profileLink ||
                formData.profileSummary
            ) {
                // call patch ("/profile/personalInfo")
                const personalInfoUpdateForm = {
                    userId: formData.userId,
                    // email: formData.email === client.email ? null : formData.email,
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    location: formData.location,
                    // phone: formData.phone === client.phone ? null : formData.phone,
                    phone: formData.phone,
                    postCode: formData.postCode,
                    profileLink: formData.profileLink,
                    profileSummary: formData.profileSummary
                };
                await this.updatePersonalInfo(
                    userId,
                    personalInfoUpdateForm,
                    Role.ADMIN
                );
            }

            if (formData.workHistory?.length) {
                await this.updateWorkHistory(userId, formData.workHistory);
            } else await this.updateWorkHistory(userId, []);

            if (formData.educations?.length) {
                await this.updateEducationHistory(userId, formData.educations);
            } else await this.updateEducationHistory(userId, []);

            if (formData.trainings?.length) {
                await this.updateTrainings(userId, formData.trainings);
            } else await this.updateTrainings(userId, []);

            if (formData.certificates?.length) {
                await this.updateCertificates(userId, formData.certificates);
            } else await this.updateCertificates(userId, []);

            if (formData.volunteerings?.length) {
                await this.updateVolunteering(userId, formData.volunteerings);
            } else await this.updateVolunteering(userId, []);

            if (formData.publications?.length) {
                await this.updatePublications(userId, formData.publications);
            } else await this.updatePublications(userId, []);

            if (formData.patents?.length) {
                await this.updatePatents(userId, formData.patents);
            } else await this.updatePatents(userId, []);

            if (formData.memberships?.length) {
                await this.updateMemberships(userId, formData.memberships);
            } else await this.updateMemberships(userId, []);

            if (formData.projects?.length) {
                await this.updateProjects(userId, formData.projects);
            } else await this.updateProjects(userId, []);

            if (formData.awards?.length) {
                await this.updateAwards(userId, formData.awards);
            } else await this.updateAwards(userId, []);

            if (formData.technicalSkills?.length) {
                await this.updateTechnicalSkills(
                    userId,
                    formData.technicalSkills
                );
            } else await this.updateTechnicalSkills(userId, []);

            if (formData.professionalSkills?.length) {
                await this.updateProfessionalSkills(
                    userId,
                    formData.professionalSkills
                );
            } else await this.updateProfessionalSkills(userId, []);

            if (tempClient) await this.tempClientRepository.remove(tempClient);
        }
    }

    private generateCVSectionHeader(title: string) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: `${title}`,
                    bold: true,
                    size: 28,
                    color: "000000",
                    shading: {
                        type: ShadingType.HORIZONTAL_CROSS,
                        color: "D3D3D3"
                    }
                })
            ],
            // shading: {
            //     type: ShadingType.SOLID,
            //     color: "D3D3D3"
            // },
            heading: HeadingLevel.HEADING_1,
            spacing: {
                after: 10,
                before: 10
            }
        });
    }

    private generateParagraph(text: string) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    size: 24
                })
            ],
            shading: {
                type: ShadingType.SOLID,
                color: "ffffff"
            }, // Explicitly set shading to null to avoid inheriting from the header,
            spacing: {
                after: 10,
                before: 10
            }
        });
    }

    async generateCv(userId: string) {
        const client = await this.tempClientRepository.findOne({
            where: {
                userId
            }
        });

        if (!client) throw new NotFoundException("Could not find client.");

        const userData = convertClientStringToJson(client);

        const doc = new Document({
            sections: [
                {
                    children: [
                        // Name Section
                        new Paragraph({
                            alignment: "center",
                            children: [
                                new TextRun({
                                    text: `${userData.firstName} ${userData.lastName}\n`,
                                    bold: true,
                                    size: 32
                                })
                            ]
                        }),

                        // Header Section
                        new Paragraph({
                            alignment: "center",
                            children: [
                                new TextRun({
                                    text: `Phone: ${userData.phone} | Email: ${userData.email} ${userData.linkedin ? "| LinkedIn: " + userData.linkedin : ""} ${userData.location || userData.town ? "| City: " + userData.location ?? userData.town : ""} ${userData.portfolio ? "| Portfolio: " + userData.portfolio : ""}`,
                                    size: 24
                                })
                            ]
                        }),

                        userData.profileSummary
                            ? [
                                this.generateCVSectionHeader("Profile"),
                                new Paragraph({
                                    alignment: "center",
                                    text: userData.profileSummary
                                })
                            ]
                            : [],

                        // Work Experience Section
                        ...(userData.workHistory
                            ? [
                                this.generateCVSectionHeader(
                                    "Work Experience"
                                ),
                                ...userData.workHistory.flatMap((job) => [
                                    new Paragraph({
                                        text: `${job.startDate} - ${job.endDate}\t${job.jobTitle} at ${job.companyName}`,
                                        heading: HeadingLevel.HEADING_2
                                    }),
                                    new Paragraph({
                                        text: job.role
                                    }),
                                    new Paragraph({
                                        text: "Responsibilities:",
                                        bullet: { level: 0 }
                                    }),
                                    ...job.responsibilities.map(
                                        (responsibility) =>
                                            new Paragraph({
                                                text: responsibility,
                                                bullet: { level: 1 }
                                            })
                                    ),
                                    new Paragraph({
                                        text: "Key Achievements:",
                                        bullet: { level: 0 }
                                    }),
                                    ...job.achievements.map(
                                        (achievement) =>
                                            new Paragraph({
                                                text: achievement,
                                                bullet: { level: 1 }
                                            })
                                    )
                                ])
                            ]
                            : []),

                        // Education Section
                        ...(userData.educations
                            ? [
                                this.generateCVSectionHeader(
                                    "Education and Qualifications"
                                ),
                                ...userData.educations.map(
                                    (education) =>
                                        new Paragraph({
                                            text: `${education.startDate} - ${education.endDate}\t${education.educationLevel} in ${education.fieldOfStudy} from ${education.institutionName}`
                                        })
                                )
                            ]
                            : []),

                        // Trainings Section
                        ...(userData.trainings
                            ? [
                                this.generateCVSectionHeader(
                                    "Training and Certification"
                                ),
                                ...userData.trainings.map(
                                    (training) =>
                                        new Paragraph({
                                            text: `${training.startDate} - ${training.endDate}\t${training.title} at ${training.institutionName}`
                                        })
                                )
                            ]
                            : []),

                        // Certificates Section
                        ...(userData.certificates
                            ? [
                                this.generateCVSectionHeader("Certificates"),
                                ...userData.certificates.map(
                                    (certificate) =>
                                        new Paragraph({
                                            text: `${certificate.year}\t${certificate.name} from ${certificate.issuer}`
                                        })
                                )
                            ]
                            : []),

                        // Volunteer Experience Section
                        ...(userData.volunteerings
                            ? [
                                this.generateCVSectionHeader(
                                    "Volunteering Experiences"
                                ),
                                ...userData.volunteerings.map(
                                    (volunteer) =>
                                        new Paragraph({
                                            text: `${volunteer.startDate} - ${volunteer.endDate}\t${volunteer.title} at ${volunteer.organizationName} (${volunteer.city})`
                                        })
                                )
                            ]
                            : []),

                        // Publications Section
                        ...(userData.publications
                            ? [
                                this.generateCVSectionHeader("Publications"),
                                ...userData.publications.map(
                                    (publication) =>
                                        new Paragraph({
                                            text: `${publication.year}\t${publication.title} by ${publication.publisher} (${publication.url})`
                                        })
                                )
                            ]
                            : []),

                        // Patents Section
                        ...(userData.patents
                            ? [
                                this.generateCVSectionHeader("Patents"),
                                ...userData.patents.map(
                                    (patent) =>
                                        new Paragraph({
                                            text: `${patent.date}\t${patent.name} (${patent.url})`
                                        })
                                )
                            ]
                            : []),

                        // Projects Section
                        ...(userData.projects
                            ? [
                                this.generateCVSectionHeader("Key Projects"),
                                ...userData.projects.flatMap((project) => [
                                    new Paragraph({
                                        text: `${project.name}`,
                                        heading: HeadingLevel.HEADING_2
                                    }),
                                    new Paragraph({
                                        text: `Scope: ${project.scope}`
                                    }),
                                    new Paragraph({
                                        text: `Budget: ${project.budget}`
                                    }),
                                    new Paragraph({
                                        text: `Team Size: ${project.teamSize}`
                                    }),
                                    new Paragraph({
                                        text: `Result: ${project.result}`
                                    })
                                ])
                            ]
                            : []),

                        // Memberships Section
                        ...(userData.memberships
                            ? [
                                this.generateCVSectionHeader(
                                    "Professional Memberships and Associations"
                                ),
                                ...userData.memberships.map(
                                    (membership) =>
                                        new Paragraph({
                                            text: `${membership.startDate} - ${membership.endDate}\t${membership.name} by ${membership.issuer}`
                                        })
                                )
                            ]
                            : []),

                        // Awards Section
                        ...(userData.awards
                            ? [
                                this.generateCVSectionHeader(
                                    "Additional Achievements and Recognitions"
                                ),
                                ...userData.awards.map(
                                    (award) =>
                                        new Paragraph({
                                            text: `${award.year}\t${award.name_of_award} by ${award.issuer}`
                                        })
                                )
                            ]
                            : []),

                        // Professional Skills Section
                        ...(userData.professionalSkills
                            ? [
                                this.generateCVSectionHeader(
                                    "Professional Skills"
                                ),
                                ...userData.professionalSkills.map(
                                    (skill) =>
                                        new Paragraph({
                                            text: skill
                                        })
                                )
                            ]
                            : []),

                        // Technical Skills Section
                        ...(userData.technicalSkills
                            ? [
                                this.generateCVSectionHeader(
                                    "Technical Skills"
                                ),
                                ...userData.technicalSkills.map(
                                    (skill) =>
                                        new Paragraph({
                                            text: skill
                                        })
                                )
                            ]
                            : []),

                        // References Section
                        this.generateCVSectionHeader("References")
                        // Uncomment and update if you want to include references
                        // ...userData.references?.map((reference) =>
                        //   new Paragraph({
                        //     text: `${reference.name} (${reference.jobTitle}) at ${reference.organizationName} - Phone: ${reference.phone}, Email: ${reference.email}`
                        //   })
                        // )
                    ]
                }
            ]
        });

        const buffer = await Packer.toBuffer(doc);

        const mockFile: Express.Multer.File = {
            fieldname: "file",
            originalname:
                userData.firstName +
                " " +
                userData.lastName +
                " Auto Generated CV.docx",
            encoding: "7bit",
            mimetype:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: buffer.length,
            buffer: buffer,
            destination: "", // Not used since we're using buffer
            filename: "", // Not used since we're using buffer
            path: "", // Not used since we're using buffer
            stream: null // Not used since we're using buffer
        };

        // TODO:  save this buffer as cv file in file db
        await this.fileService._upload(
            UserRole.ADMIN,
            UploadType.GENERATED_CV,
            userId,
            mockFile
        );

        return buffer;
    }

    async adminUploadCv(
        userId: string,
        file: Express.Multer.File,
        uploadType: UploadType
    ) {
        const uploadedFile = await this.fileService._upload(
            UserRole.ADMIN,
            uploadType,
            userId,
            file
        );
        return {
            status: API_STATUS.SUCCESS,
            message: "File uploaded Successfully",
            data: uploadedFile
        };
    }

    async deleteCV(fileId: string) {
        return await this.fileService.deleteFile(fileId, null);
    }

    async geCVs(query: GetFilesQueryDto, userId: string) {
        return await this.fileService.getAdminCVFiles(query, userId);
    }

    async finalCV(fileId: string, userId: string) {
        const file = await this.fileService.setFileAsFinal(fileId);
        const res = await this.servicesService.moveToNextService({ userId });
        return res;
    }

    private async generateSecret(
        userId: string,
        expiry: "expire" | "no-expiry" = "expire"
    ) {
        const [at] = await Promise.all([
            this.jwtService.sign(
                {
                    sub: userId
                },
                {
                    secret: process.env.EMAIN_VERIFICATION_SECRET,
                    expiresIn: expiry === "expire" ? "15d" : "100y"
                }
            )
        ]);
        return at;
    }
}
