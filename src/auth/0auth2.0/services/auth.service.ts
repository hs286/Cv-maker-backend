/* eslint-disable prettier/prettier */
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt/dist";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Brackets, ILike, IsNull, Not, Or, Repository } from "typeorm";
import {
    AdminGetUsersQuery,
    LogInDTO,
    SignupWithoutCVDto,
    SimplySignupDTO
} from "../DTOs";
import { User } from "../entites/user.entity";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { LoginResponse, SignupResponse } from "../responses";
import { ConfigService } from "@nestjs/config";
import { Role as UserRoles, Role } from "../enums";
import {
    ApiResponse,
    ApiResponseWithPagination,
    ApiResponseWithPagination2
} from "src/globals/responses";
import { API_STATUS } from "src/globals/enums";
import { JobRole } from "../entites/jobRole.entity";
import { v4 as uuidv4 } from "uuid";
import { EmailSendingService } from "src/emails/services/email.service";
import { LogService } from "src/logger";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { PaginationDTO } from "src/globals/DTOs";
import { AdminCreateDto } from "../DTOs/adminCreate.dto";
import * as process from "process";
import { ClientCreateDto } from "../DTOs/clientCreate.dto";
import { TempClient } from "../entites/temptClient.entity";
import { UploadType } from "../../../files/enums";
import { FilesService } from "../../../files/services/files.service";
import { StripeService } from "../../../payments/services/stripe.service";
import { Location } from "../../../mise/entities/location.entity";
import { ValuatorService } from "src/valuator/services/valuator.service";
import { SignupWithCVInfoDto } from "../DTOs/signupWithCVInfo.dto";
import { readFileSync } from "fs";
import { basename } from "path";
import { PackageService } from "../../../packageAndService/package/services/package.service";
import { ServiceService } from "../../../packageAndService/service/services/service.service";
import { convertClientCRMClientIntoIntraCRM } from "../../../utils/helperFunctions";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) public userRepository: Repository<User>,
        @InjectRepository(TempClient)
        public tempClientRepository: Repository<TempClient>,
        @InjectRepository(JobRole)
        public jobRoleRepository: Repository<JobRole>,
        @InjectRepository(Location)
        public locationRepository: Repository<Location>,
        @InjectRepository(CVProfile)
        public cvProfileRepository: Repository<CVProfile>,
        private httpService: HttpService,
        private configService: ConfigService,
        private emailSendingService: EmailSendingService,
        @Inject(forwardRef(() => JwtService))
        private jwtService: JwtService,
        private logService: LogService,
        private filesService: FilesService,
        @Inject(forwardRef(() => ValuatorService))
        private readonly valuatorService: ValuatorService,
        private stripeService: StripeService,
        private packageService: PackageService,
        private serviceService: ServiceService
    ) {
    }

    // **************************** jwt based auth**********************************************************

    /**
     * The function "hashData" asynchronously hashes a given string using bcrypt with a cost factor of
     * 10.
     * @param {string} data - The `data` parameter is a string that represents the data that you want to
     * hash.
     * @returns a promise that resolves to the hashed version of the input data using bcrypt with a cost
     * factor of 10.
     */
    async hashData(data: string) {
        return bcrypt.hash(data, 10);
    }

    /**
     * The function `getTokens` generates an access token and a refresh token using the provided user ID,
     * email, and role.
     * @param {string} userId - A unique identifier for the user.
     * @param {string} email - The `email` parameter is a string that represents the user's email
     * address.
     * @param {Role} role - The `role` parameter is a variable of type `Role`. It represents the role of
     * the user. The specific values that can be assigned to `role` depend on the implementation of the
     * `Role` type.
     * @param expiry
     * @returns The function `getTokens` returns an object with two properties: `access_token` and
     * `refresh_token`. The values of these properties are the generated access token (`at`) and refresh
     * token (`rt`) respectively.
     */
    async getToken(
        userId: string,
        email: string,
        role: Role,
        expiry: "expire" | "no-expiry" = "expire"
    ) {
        const [at] = await Promise.all([
            this.jwtService.sign(
                {
                    sub: userId,
                    email,
                    role
                },
                {
                    // secret: process.env.AT_SECRET,
                    // expiresIn: process.env.AT_EXPIRY,
                    secret: process.env.AT_SECRET,
                    expiresIn: expiry === "expire" ? "15d" : "100y"
                    //15 minutes
                }
            )
        ]);

        return {
            access_token: at
        };
    }

    /**
     * The function `signUpWithCV` is an asynchronous function that takes a file as input, sends it to an
     * API for processing, and then creates a new user based on the response from the API.
     * @param file - The `file` parameter is of type `Express.Multer.File`, which is an interface
     * provided by the Multer middleware for handling file uploads in Express.js. It represents a file
     * that has been uploaded by the user.
     * @returns The function `signUpWithCV` returns a Promise that resolves to an `ApiResponse` object.
     */
    async signUpWithCV(file: Express.Multer.File): Promise<ApiResponse> {

        if (!file) {
            throw new BadRequestException("File not found");
        }

        const apiKey = await this.configService.get("api.CVReaderApiKey");

        const apiUrl = `${await this.configService.get(
            "api.CVReaderBaseUrl"
        )}/get-details`;

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
        };

        // Convert the Buffer to a Blob
        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        // Create a FormData object to handle file upload
        const formData = new FormData();
        formData.append("file", fileBlob, file.originalname);

        try {
            // initially upload the cv to /get-details and get "first_name", "last_name", "email", "phoneNumber" and "city" and create
            // Response sample

            /*
            {
              "info":{
                "first_name":"Mahfuzur",
                "last_name":"Rahman Emon",
                "email":"emon.swe.sust@gmail.com",
                "phoneNumber":"+8801521702334",
                "city":"Dhaka"
              }
            }
             */

            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );

            const { info } = response.data;

            // validate email  by checking already exists or not
            const userExists = await this.fetchUserByEmail(info.email);

            if (userExists) {
                throw new ConflictException(
                    "CV already registered. Please login with your email and password"
                );
            }

            // Step1: create a user with this minimal data
            const newUser = new User();
            newUser.userId = uuidv4();
            newUser.isActive = true;
            newUser.cvLibUserId = new Date().getTime();
            newUser.email = info.email;
            newUser.firstName = info.first_name;
            newUser.lastName = info.last_name;
            newUser.location = String(info?.city ?? "").replace(
                /"NONE"/g,
                null
            );
            newUser.county = String(info?.city ?? "").replace(/"NONE"/g, null);

            const wheres = [];

            if (newUser.location) {
                wheres.push({
                    county: newUser.location
                });
                wheres.push({
                    town: newUser.location
                });
            }

            if (newUser.county) {
                wheres.push({
                    county: newUser.county
                });
                wheres.push({
                    town: newUser.county
                });
            }

            const location = await this.locationRepository.findOneBy(wheres);

            if (location) {
                newUser.county = location.county;
                newUser.postcode = location.postcode;
                newUser.location = location.town;
            }

            newUser.phone = info.phoneNumber;

            // always a client
            newUser.role = Role.CLIENT;

            // generate a temporary password and send to user after encrypting.
            // generate a random 8 character password.
            const tempPassword = Math.random().toString(36).slice(-8);
            newUser.password = await this.hashData(tempPassword);
            newUser.isCvProcessing = true;

            const savedUser = await this.userRepository.save(newUser);

            console.log(`Initial user created in db.`);

            // save the file
            const uploadedFile = await this.filesService._upload(
                UserRoles.CLIENT,
                UploadType.UPLOAD,
                savedUser.userId,
                file,
                true
            );

            savedUser.cvUrl = uploadedFile.path; //"path":  "uploaded-files/users/0e81116f-c36e-44d0-9fc7-54f8177a70b5/upload/35954bd1-2e91-4a66-9e1d-0d5d0327d5cd.pdf",

            await this.userRepository.save(newUser);

            const token = await this.getToken(
                newUser.userId,
                newUser.email,
                newUser.role as Role
            );

            console.log("USer created successfully.");

            // send account creation Email
            await this.emailSendingService
                .sendAccountCreationEmail(
                    info.email,
                    "SPYRE CRM ACCOUNT CREATED",
                    "withPassword",
                    tempPassword
                )
                .then((res) => {
                    console.log(
                        `Email send to ${info.email} | Temp-Password:${tempPassword}`
                    );
                })
                .catch((err) => {
                    this.logService.error(
                        `signUpWithCV:emailSendingService ${err}`
                    );
                });

            // let the sink in!
            this.continueRestSignupByCv(formData, savedUser)
                .then()
                .catch((err) => console.log("CV Upload error", err));

            return {
                status: API_STATUS.SUCCESS,
                message: "User created successfully",
                data: {
                    email: savedUser.email,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    location: savedUser.location,
                    phone: savedUser.phone,
                    token: token.access_token
                }
            };
        } catch (err) {
            console.log("err ->", err);
            this.logService.error(`signUpWithCV ${err}`);
            throw new InternalServerErrorException(
                `An Error Occurred. please try again. Details: ${err}`
            );
        }
    }

    async fetchSignupInfoFromCv(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException("File not found");
        }

        const apiKey = await this.configService.get("api.CVReaderApiKey");

        const apiUrl = `${await this.configService.get(
            "api.CVReaderBaseUrl"
        )}/get-details`;

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
        };

        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        const formData = new FormData();
        formData.append("file", fileBlob, file.originalname);

        // initially upload the cv to /get-details and get "first_name", "last_name", "email", "phoneNumber" and "city" and create
        // Response sample

        /*
        {
          "info":{
            "first_name":"Mahfuzur",
            "last_name":"Rahman Emon",
            "email":"emon.swe.sust@gmail.com",
            "phoneNumber":"+8801521702334",
            "city":"Dhaka"
          }
        }
         */

        let response;

        try {
            console.log(
                "Calling CV Reader Api to fetch personal information",
                apiUrl,
                formData
            );
            response = await firstValueFrom(
                this.httpService.post(apiUrl, formData, config)
            );
            console.log(
                "Response from CV Reader Api response",
                apiUrl,
                response.data ?? response
            );
        } catch (error) {
            console.error(
                "Failed to fetch personal information by CV Reader API",
                error.status,
                error.response.data ?? JSON.parse(error)
            );
            throw new BadRequestException(
                "Failed to fetch personal information from CV"
            );
        }

        const { info } = response.data;

        // validate email  by checking already exists or not
        const userExists = await this.fetchUserByEmail(info.email);

        if (userExists) {
            throw new ConflictException(
                "CV already registered. Please login with your email and password"
            );
        }

        // Step1: create a user with this minimal data
        const newUser = new User();
        newUser.userId = uuidv4();
        newUser.cvLibUserId = new Date().getTime();
        newUser.email = info.email;
        newUser.firstName = info.first_name;
        newUser.lastName = info.last_name;
        newUser.location = String(info?.city ?? "").replace(/"NONE"/g, null);
        newUser.county = newUser.location;

        const wheres = [];

        if (newUser.location) {
            wheres.push({
                county: newUser.location
            });
            wheres.push({
                town: newUser.location
            });
        }

        if (newUser.county) {
            wheres.push({
                county: newUser.county
            });
            wheres.push({
                town: newUser.county
            });
        }

        const location = await this.locationRepository.findOneBy(wheres);

        if (location) {
            newUser.county = location.county;
            newUser.postcode = location.postcode;
            newUser.location = location.town;
        }

        newUser.phone = info.phoneNumber;

        // always a client
        newUser.role = Role.CLIENT;

        // generate a temporary password and send to user after encrypting.
        // generate a random 8 character password.
        const tempPassword = Math.random().toString(36).slice(-8);
        newUser.password = await this.hashData(tempPassword);
        newUser.isCvProcessing = true;

        const savedUser = await this.userRepository.save(newUser);

        console.log(`Initial user created in db.`);

        // save the file
        const uploadedFile = await this.filesService._upload(
            UserRoles.CLIENT,
            UploadType.UPLOAD,
            savedUser.userId,
            file,
            true
        );

        savedUser.cvUrl = uploadedFile.path; //"path":  "uploaded-files/users/0e81116f-c36e-44d0-9fc7-54f8177a70b5/upload/35954bd1-2e91-4a66-9e1d-0d5d0327d5cd.pdf",

        await this.userRepository.save(savedUser);

        // send account creation Email
        // await this.emailSendingService
        //   .sendAccountCreationEmail(
        //     info.email,
        //     "SPYRE CRM ACCOUNT CREATED",
        //     "withPassword",
        //     tempPassword
        //   )
        //   .then((res) => {
        //     console.log(
        //       `Email send to ${info.email} | Temp-Password:${tempPassword}`
        //     );
        //   })
        //   .catch((err) => {
        //     this.logService.error(`signUpWithCV:emailSendingService ${err}`);
        //   });

        const token = await this.getToken(
            savedUser.userId,
            savedUser.email,
            savedUser.role as Role
        );

        delete savedUser.password;

        return {
            status: API_STATUS.SUCCESS,
            message:
                "Initial User created successfully. Please check email to verify your email",
            data: {
                ...savedUser,
                token: token.access_token
            }
        };
    }

    async signupWithInfoFromCV(signupWithCVInfoDto: SignupWithCVInfoDto) {
        const user = await this.userRepository.findOne({
            where: {
                userId: signupWithCVInfoDto.userId
            }
        });

        if (!user) throw new NotFoundException("Could not find user");

        if (user.isActive)
            throw new ConflictException("User already activated. Please login");

        if (!user.isEmailActive)
            throw new BadRequestException(
                "Email address is not verified. Please verify and try again."
            );

        if (!user.isPhoneActive)
            throw new BadRequestException(
                "Phone number is not verified. Please verify and try again."
            );

        if (user.email !== signupWithCVInfoDto.email && !user.isEmailActive)
            throw new BadRequestException(
                "New email address is not verified. Please verify and try again."
            );

        if (user.phone !== signupWithCVInfoDto.phone && !user.isPhoneActive)
            throw new BadRequestException(
                "New phone number is not verified. Please verify and try again."
            );

        user.firstName = signupWithCVInfoDto.firstName;
        user.lastName = signupWithCVInfoDto.lastName;
        user.password = await this.hashData(signupWithCVInfoDto.password);
        user.location =
            signupWithCVInfoDto.location ??
            signupWithCVInfoDto.town ??
            user.location;
        user.county = signupWithCVInfoDto.county ?? user.county;
        user.postcode = signupWithCVInfoDto.postcode ?? user.postcode;

        user.isActive = true;

        user.jobTarget1 = signupWithCVInfoDto.jobTarget;
        user.targetRole = signupWithCVInfoDto.jobTarget;

        await this.userRepository.save(user);

        const token = await this.getToken(
            user.userId,
            user.email,
            user.role as Role
        );

        delete user.password;

        const fileBuffer = readFileSync(user.cvUrl);

        const file = {
            fieldname: "file",
            originalname: basename(user.cvUrl),
            encoding: "utf8",
            mimetype: "application/pdf",
            buffer: fileBuffer,
            size: fileBuffer.length
        };

        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        const formData = new FormData();
        formData.append("file", fileBlob, file.originalname);

        // let the sink in!
        this.continueRestSignupByCv(formData, user)
            .then()
            .catch((err) => console.log("CV Upload error", err));

        return {
            status: API_STATUS.SUCCESS,
            message: "User signup successfully",
            data: {
                ...user,
                token: token.access_token
            }
        };
    }

    private async continueRestSignupByCv(formData: FormData, user: User) {
        // re-upload the cv to /upload endpoint and do the other stuffs
        const apiKey = await this.configService.get("api.CVReaderApiKey");
        const apiUrl = `${await this.configService.get(
            "api.CVReaderBaseUrl"
        )}/upload`;
        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
        };

        const response = await firstValueFrom(
            this.httpService.post(apiUrl, formData, config)
        );

        const basicCVDetails = response.data;

        user.highestEducation = basicCVDetails.highestEducation;
        user.hasUploadedCV = true;
        user.isCvProcessing = false;

        // Step2: save cv profile
        const cvProfile = new CVProfile();
        cvProfile.CVProfileStringified = JSON.stringify(response?.data);
        cvProfile.user = <any>{ userId: user.userId };

        await this.cvProfileRepository.save(cvProfile);

        //Step3: save career history
        const careerHistory: Array<any> = response?.data?.history;

        if (careerHistory?.length > 0) {
            for (const job of careerHistory) {
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
            }
        }

        // store user's skills. skills from api response is array of strings. so we stringify it and store in db
        const technicalSkills =
            response?.data?.technicalSkills ?? response?.data?.skills;
        if (technicalSkills?.length > 0) {
            user.technicalSkills = JSON.stringify(technicalSkills).replace(
                /"NONE"/g,
                null
            );
        }

        const professionalSkills =
            response?.data?.professionalSkills ?? response?.data?.skills;
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
            user.extras = JSON.stringify(extraInfo).replace(/"NONE"/g, null);
        }

        user.hasUploadedCV = true;

        // save updated info in db
        await this.userRepository.save(user);

        console.log("All data saved from cv");
    }

    /**
     * The `signUpWithoutCV` function is used to register a new user without a CV and return a response
     * with the user's information and access token.
     * @param {SignupWithoutCVDto} signupWithoutCVDto - The parameter `signupWithoutCVDto` is an object
     * that contains all the properties:
     * @returns a Promise that resolves to an ApiResponse object.
     */
    async signUpWithoutCV(
        signupWithoutCVDto: SignupWithoutCVDto
    ): Promise<ApiResponse> {
        console.log("dto incoming", signupWithoutCVDto);
        const user = await this.fetchUserByEmail(signupWithoutCVDto.email);
        if (user) {
            throw new ConflictException(
                "You are already registered. Please login with your email and password"
            );
        }
        const newUser = new User();
        const userId = uuidv4();
        newUser.userId = userId;
        newUser.cvLibUserId = new Date().getTime();
        newUser.email = signupWithoutCVDto?.email;
        newUser.firstName = signupWithoutCVDto?.firstName;
        newUser.lastName = signupWithoutCVDto?.lastName;
        newUser.location = signupWithoutCVDto?.location;
        newUser.phone = signupWithoutCVDto?.phone;
        newUser.role = Role.CLIENT;
        const tempPassword = Math.random().toString(36).slice(-8);
        newUser.password = await this.hashData(tempPassword);
        newUser.jobTarget1 = signupWithoutCVDto?.jobTarget1;
        // newUser.jobTarget2 = signupWithoutCVDto?.jobTarget2;
        newUser.linkedInLink = signupWithoutCVDto?.linkedInLink;
        newUser.profileLink = signupWithoutCVDto?.profileLink;
        // note: this is a JSON string
        newUser.technicalSkills = signupWithoutCVDto?.technicalSkills;
        newUser.professionalSkills = signupWithoutCVDto?.professionalSkills;
        // newUser.skill2 = signupWithoutCVDto?.skill2;
        // newUser.skill2 = signupWithoutCVDto?.skill3;
        // note: this is a JSON string
        newUser.education = signupWithoutCVDto?.educationCertificates;
        // newUser.educationCertificate2 = signupWithoutCVDto?.educationCertificate2;
        newUser.additionalNotes = signupWithoutCVDto?.additionalNotes;

        signupWithoutCVDto?.jobRoles?.forEach(async (jobRole) => {
            const newJobRole = new JobRole();
            newJobRole.companyName = jobRole.companyName;
            newJobRole.jobTitle = jobRole.jobTitle;
            newJobRole.startDate = jobRole.startDate;
            newJobRole.endDate = jobRole.endDate;
            newJobRole.additionalDetails = jobRole.additionalDetails;
            newJobRole.user = <any>{ userId };
            newUser?.jobRoles?.push(newJobRole);
            await this.jobRoleRepository.save(newJobRole);
        });

        // get token
        const token = await this.getToken(
            newUser.userId,
            newUser.email,
            newUser.role as Role
        );

        // save user
        const savedUser = await this.userRepository.save(newUser);

        // save JSON profile of user
        const parsedEducation = (JSON.parse(
            signupWithoutCVDto.educationCertificates
        ) || []) as [];
        const userProfile = {
            info: {
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                phone: savedUser.phone,
                location: savedUser.location
            },
            history: signupWithoutCVDto.jobRoles,
            education: parsedEducation,
            professionalSkills: JSON.parse(
                signupWithoutCVDto.professionalSkills
            ),
            technicalSkills: JSON.parse(signupWithoutCVDto.technicalSkills)
        };

        const cvProfile = new CVProfile();
        cvProfile.CVProfileStringified = JSON.stringify(userProfile);
        cvProfile.user = { userId: savedUser.userId } as User;

        // send account creation Email
        await this.emailSendingService
            .sendAccountCreationEmail(
                newUser.email,
                "SPYRE CRM ACCOUNT CREATED",
                "withPassword",
                tempPassword
            )
            .catch((err) => {
                this.logService.error(
                    `signUpWithoutCV:emailSendingService ${err}`
                );
            });

        // return user object without password and with access token required for login
        const userResponse: SignupResponse = {
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            location: savedUser.location,
            phone: savedUser.phone,
            token: token.access_token
        };

        const apiResponse: ApiResponse<SignupResponse> = {
            status: API_STATUS.SUCCESS,
            message: "User created successfully",
            data: userResponse
        };
        return apiResponse;
    }

    /**
     * The `simplyRegister` function is very similar to `signUpWithoutCV` but requires even less input fields from the user. it, too, returns a response
     * with the user's information and access token.
     * @param {SimplySignupDTO} simplySignupDTO - The parameter `signupWithoutCVDto` is an object
     * that contains all the properties:
     * @returns a Promise that resolves to an ApiResponse object.
     */
    async simplyRegister(
        simplySignupDTO: SimplySignupDTO
    ): Promise<ApiResponse> {
        const user = await this.fetchUserByEmail(simplySignupDTO.email);
        if (user) {
            throw new ConflictException(
                "You are already registered. Please login with your email and password"
            );
        }
        const newUser = new User();
        const userId = uuidv4();
        newUser.userId = userId;
        newUser.cvLibUserId = new Date().getTime();
        newUser.email = simplySignupDTO?.email;
        newUser.firstName = simplySignupDTO?.firstName;
        newUser.lastName = simplySignupDTO?.lastName;
        newUser.phone = simplySignupDTO?.phone;
        newUser.role = Role.CLIENT;
        const hashedPassword = await this.hashData(simplySignupDTO.password);
        newUser.password = hashedPassword;

        // get token
        const token = await this.getToken(
            newUser.userId,
            newUser.email,
            newUser.role as Role
        );

        // save user
        const savedUser = await this.userRepository.save(newUser);

        // user profile
        const userProfile = {
            info: {
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                phone: savedUser.phone,
                location: savedUser.location
            }
        };

        const cvProfile = new CVProfile();
        cvProfile.CVProfileStringified = JSON.stringify(userProfile);
        cvProfile.user = { userId: savedUser.userId } as User;

        await this.emailSendingService
            .sendAccountCreationEmail(
                newUser.email,
                "SPYRE CRM ACCOUNT CREATED",
                "withoutPassword"
            )
            .catch((err) => {
                this.logService.error(
                    `simplyRegister:emailSendingService ${err}`
                );
            });

        // return user object without password and with access token required for login
        const userResponse: SignupResponse = {
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            location: savedUser.location,
            phone: savedUser.phone,
            token: token.access_token
        };

        const apiResponse: ApiResponse<SignupResponse> = {
            status: API_STATUS.SUCCESS,
            message: "User created successfully",
            data: userResponse
        };
        return apiResponse;
    }

    /**
     * The `simplyRegister` function is very similar to `signUpWithoutCV` but requires even less input fields from the user. it too returns a response
     * with the user's information and access token.
     * @param {SimplySignupDTO} simplySignupDTO - The parameter `signupWithoutCVDto` is an object
     * that contains all the properties:
     * @returns a Promise that resolves to an ApiResponse object.
     */
    async intraSimplyRegister(
        simplySignupDTO: ClientCreateDto
    ): Promise<ApiResponse> {
        const user = await this.fetchUserByEmail(simplySignupDTO.email);

        if (user) {
            throw new ConflictException(
                "This user has already registered an account"
            );
        }

        const basket: {
            productId?: string;
            priceId?: string;
            packageName?: string;
            totalCost?: number;
            paymentStatus?: string;
            multiPackageDiscount?: number;
            savings?: number;
            discountedPrice?: number;
            actualServices?: string[];
            stripeCustomerId?: string;
        } = {
            paymentStatus: "pending"
        };

        if (simplySignupDTO.package || simplySignupDTO.services.length > 0) {
            // check if the email already exists in the stripe
            const stripeCustomer = await this.stripeService.getCustomerByEmail(
                simplySignupDTO.email
            );

            const stripeCustomerId = stripeCustomer
                ? stripeCustomer.id
                : await this.stripeService.createCustomer(
                    `${simplySignupDTO.firstName} ${simplySignupDTO.lastName}`,
                    simplySignupDTO.email
                );
            const payload: any = {
                stripeCustomerId,
                discount: simplySignupDTO.discount
            };

            const discount =
                simplySignupDTO.discount &&
                (await this.stripeService.getCouponsById(
                    simplySignupDTO.discount
                ));

            basket.multiPackageDiscount = discount?.data?.percent_off ?? 0;

            if (simplySignupDTO.package) {
                const pkg = await this.packageService.getPackageById(
                    simplySignupDTO.package
                );

                if (!pkg?.data) {
                    throw new BadRequestException("Invalid package");
                }

                basket.actualServices = pkg.data?.services.map(
                    (service) => service.name
                );
                basket.packageName = pkg.data.name;
                basket.totalCost = +pkg?.data?.price;

                payload.invoiceItems = [
                    {
                        name: pkg.data.name,
                        amount: pkg.data.price,
                        quantity: 1
                    },
                    {
                        name: pkg.data?.services
                            ?.map((service) => service.name)
                            .join(", "),
                        amount: 0,
                        quantity: 1
                    }
                ];
            } else if (simplySignupDTO.services.length > 0) {
                const services = await this.serviceService.getServicesByIds(
                    simplySignupDTO.services
                );

                if (
                    !services.data.length ||
                    services.data.length !== simplySignupDTO.services.length
                ) {
                    throw new BadRequestException("Invalid services");
                }

                const amount = services.data.reduce(
                    (total, service) => total + +service.price,
                    0
                );

                basket.actualServices = services.data.map(
                    (service) => service.name
                );

                basket.totalCost = amount;

                payload.invoiceItems = [
                    {
                        name: "Bespoke Package",
                        amount,
                        quantity: 1
                    },
                    {
                        name: services.data
                            .map((service) => service.name)
                            .join(", "),
                        amount: 0,
                        quantity: 1
                    }
                ];
            }

            basket.savings =
                basket.totalCost * (basket.multiPackageDiscount * 0.01);

            basket.discountedPrice = basket.totalCost - basket.savings;
            basket.stripeCustomerId = stripeCustomerId;

            const session =
                await this.stripeService.createInvoiceItemsAndInvoice(payload);

            await this.emailSendingService.sendEmailInvoice({
                email: simplySignupDTO.email,
                name: `${simplySignupDTO.firstName} ${simplySignupDTO.lastName}`,
                invoiceUrl: session.invoiceUrl,
                items: payload.invoiceItems
            });
        }

        const newUser = new User();

        const userId = uuidv4();

        newUser.userId = userId;
        newUser.isActive = true;
        newUser.cvLibUserId = new Date().getTime();
        newUser.email = simplySignupDTO.email;
        newUser.firstName = simplySignupDTO.firstName;
        newUser.lastName = simplySignupDTO.lastName;
        newUser.phone = simplySignupDTO.phone;
        newUser.role = Role.CLIENT;

        const hashedPassword = await this.hashData(
            process.env.CLIENT_DEFAULT_PASSWORD
        );

        newUser.password = hashedPassword;

        if (simplySignupDTO.cvSpecialist)
            newUser.cvSpecialistId = simplySignupDTO.cvSpecialist;

        // intra crm things
        newUser.cvSpecialistId = simplySignupDTO.cvSpecialist;
        newUser.salary = simplySignupDTO.salary;
        newUser.salesPerson = simplySignupDTO.salesPerson;
        newUser.source = simplySignupDTO.source;
        newUser.targetRole = simplySignupDTO.targetRole;
        newUser.jobTarget1 = simplySignupDTO.targetRole;
        newUser.jobSector = simplySignupDTO.sector;
        newUser.county = simplySignupDTO.county;
        // newUser.package = simplySignupDTO.package;
        newUser.paymentType = simplySignupDTO.paymentType;
        // newUser.services = simplySignupDTO.services;
        newUser.referral = simplySignupDTO.referral;
        newUser.discount = simplySignupDTO.discount;

        if (basket) {
            newUser.stripeCustomerId = basket.stripeCustomerId;
            delete basket.stripeCustomerId;
            newUser.basket = JSON.stringify(basket);
        }

        // save user
        const savedUser = await this.userRepository.save(newUser);

        // return user object without password and with access token required for login
        const userResponse: Omit<any, "token"> & { userId: string } = {
            userId: savedUser.userId,
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            location: savedUser.location,
            phone: savedUser.phone,
            source: savedUser.source,
            cvSpecialistId: simplySignupDTO.cvSpecialist,
            targetRole: savedUser.targetRole,
            sector: savedUser.sector,
            createdAt: new Date()
        };

        const apiResponse: ApiResponse<Omit<any, "token">> = {
            status: API_STATUS.SUCCESS,
            message: "Client created successfully",
            data: userResponse
        };
        return apiResponse;
    }

    /**
     * The function updates the password of a user based on a verification token that was sent on email and returns a success
     * message.
     * @param {string} token - A string representing the token used for verification and authentication.
     * @param {string} newPassword - The `newPassword` parameter is a string that represents the new
     * password that the user wants to set.
     * @returns An object is being returned with two properties: "status" and "message". The "status"
     * property is set to "success" and the "message" property is set to "Password updated.".
     */
    async setUserPassword(token: string, newPassword: string) {
        const result = await this.jwtService.verify(token, {
            secret: process.env.VERIFICATION_SECRET
        });

        const userEmail = result?.email;
        const user = await this.userRepository.findOne({
            where: {
                email: userEmail
            }
        });
        if (!user) {
            throw new ForbiddenException("No such user exists ! ");
        }
        const hashedPassword = await this.hashData(newPassword);
        user.password = hashedPassword;
        await this.userRepository.save(user);
        return {
            status: "success ",
            message: "Password updated."
        };
    }

    /**
     * The logIn function checks if a user exists, verifies their password, and returns tokens and user
     * information if successful.
     * @param {LogInDTO} loginDTO - The `loginDTO` parameter is an object that contains the following
     * properties:
     * @returns an object that contains the tokens and user information.
     */
    async logIn(loginDTO: LogInDTO) {
        const user = await this.userRepository.findOne({
            where: {
                email: loginDTO.email
            }
        });

        if (!user) {
            throw new NotFoundException("Please enter a valid email address");
        }

        if (!user.isActive) {
            throw new ForbiddenException("Email address is not verified yet.");
        }

        const passwordMatchs = await bcrypt.compare(
            loginDTO.password,
            user?.password
        );

        if (!passwordMatchs) {
            throw new ForbiddenException("email or Password incorrect");
        }

        const token = await this.getToken(
            user.userId,
            user.email,
            user.role as Role
        );
        const userResponse: LoginResponse = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            location: user.location,
            phone: user.phone,
            token: token.access_token
        };

        const apiResponse: ApiResponse<LoginResponse> = {
            status: API_STATUS.SUCCESS,
            message: "User logged in successfully",
            data: userResponse
        };

        return apiResponse;
    }

    /**
     * The function refreshTokens takes a user ID and a refresh token, retrieves the user from the
     * database, compares the refresh token with the hashed refresh token stored in the user object,
     * generates new tokens, and returns the new tokens along with the user details.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of the user for whom the tokens need to be refreshed.
     * @returns an object with two properties: "newTokens" and "userDetails". The "newTokens" property
     * contains the newly generated tokens, while the "userDetails" property contains the details of the
     * user.
     */
    async refreshTokens(userId: string) {
        const user = await this.userRepository.findOne({
            where: { userId: userId }
        });
        if (!user) {
            throw new NotFoundException("user not found");
        }

        const newTokens = await this.getToken(
            user.userId,
            user.email,
            user.role as Role
        );

        return {
            newTokens,
            userDetails: user
        };
    }

    /**
     * The function fetches a user from the user repository based on their email and returns the user
     * object if found, otherwise returns null.
     * @param {string} email - The email parameter is a string that represents the email address of the
     * user you want to fetch.
     * @returns the user object if it exists, otherwise it returns null.
     */
    async fetchUserByEmail(email: string) {
        const user = await this.userRepository.findOne({
            where: {
                email: email
            }
        });
        if (!user) {
            return null;
        }
        return user;
    }

    /**
     * `getIntraAdmin()` returns the token that is being used by intra-crm backend to access spyre-crm backend
     * @returns The function getIntraAdmin returns a Promise that resolves to the object containing token
     */
    async getIntraAdmin() {
        const adminEmail = "intra-admin@intra-crm.com";

        try {
            let user = await this.userRepository.findOne({
                where: {
                    email: adminEmail
                }
            });

            if (!user) {
                user = new User();
                user.userId = uuidv4();
                user.email = adminEmail;
                user.firstName = "Intra";
                user.lastName = "Admin";
                user.phone = "12345678";
                user.role = Role.ADMIN;
                const tempPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await this.hashData(tempPassword);
                user.password = hashedPassword;
                user = await this.userRepository.save(user);
            }

            const token = await this.getToken(
                user.userId,
                user.email,
                user.role as Role,
                "no-expiry"
            );

            const apiResponse: ApiResponse<{ token: string }> = {
                status: API_STATUS.SUCCESS,
                message: "Get Token For Intra Admin",
                data: {
                    token: token.access_token
                }
            };

            return apiResponse;
        } catch (err) {
            this.logService.error(`getIntraAdmin ${err}`);
            throw new InternalServerErrorException(
                `An Error Occurred. please try again. Details: ${err}`
            );
        }
    }

    async createAdmin(reqBody: AdminCreateDto) {
        try {
            let user = await this.userRepository.findOne({
                where: {
                    email: reqBody.email
                }
            });

            if (!user) {
                user = new User();
                user.userId = uuidv4();
                user.isActive = true;
                user.email = reqBody.email;
                user.firstName = reqBody.firstName;
                user.lastName = reqBody.lastName;
                user.role = Role.ADMIN;
                const tempPassword = reqBody.password;
                console.log("reqBody", reqBody);
                user.password = await this.hashData(tempPassword);
                user = await this.userRepository.save(user);
            }

            const token = await this.getToken(
                user.userId,
                user.email,
                user.role as Role,
                "no-expiry"
            );

            const apiResponse: ApiResponse<{ token: string; userId: string }> =
                {
                    status: API_STATUS.SUCCESS,
                    message: "Find the admin token in data",
                    data: {
                        userId: user.userId,
                        token: token.access_token
                    }
                };

            return apiResponse;
        } catch (err) {
            console.log(err);
            this.logService.error(`createAdmin ${err}`);
            throw new InternalServerErrorException(
                `An Error Occurred. please try again. Details: ${err}`
            );
        }
    }

    /**
     * The function fetches a user from the user repository by their ID and returns the user object if
     * found, otherwise returns null.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of a user.
     * @returns The function fetchUserById returns a Promise that resolves to the user object if found,
     * or null if the user is not found.
     */
    async fetchUserById(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                userId,
                isActive: true
            },
            relations: {
                jobRoles: true,
                tickets: true
            }
        });
        if (!user) {
            return null;
        }

        delete user.password;

        try {
            user.extras = JSON.parse(user.extras) || {};
            user.education = JSON.parse(user.education) || [];
            user.technicalSkills = JSON.parse(user.technicalSkills) || [];
            user.professionalSkills = JSON.parse(user.professionalSkills) || [];
            user.jobRoles = this.sortJobsByDateDescending(user.jobRoles);
        } catch (err) {
            this.logService.error(`fetchUserById ${err}`);
        }

        return user;
    }

    sendFetchuserprofileSocketEvent(user: any) {
        this.valuatorService.sendFetchuserprofileSocketEvent(user.userId, {
            valuatorSalary: user.valuatorSalary,
            grammerScore: user.grammerScore,
            keyWordScore: user.keyWordScore
        });
    }

    async fetchUserByIdForIntraCrm(userId: string) {
        const tempClient = await this.tempClientRepository.findOne({
            where: {
                userId
            }
        });

        if (tempClient) {
            return {
                ...tempClient,
                workHistory: this.parseArray(tempClient.workHistory),
                educations: this.parseArray(tempClient.educations),
                trainings: this.parseArray(tempClient.trainings),
                certificates: this.parseArray(tempClient.certificates),
                awards: this.parseArray(tempClient.awards),
                volunteerings: this.parseArray(tempClient.volunteerings),
                publications: this.parseArray(tempClient.publications),
                projects: this.parseArray(tempClient.projects),
                memberships: this.parseArray(tempClient.memberships),
                patents: this.parseArray(tempClient.patents),
                technicalSkills: this.parseArray(tempClient.technicalSkills),
                professionalSkills: this.parseArray(
                    tempClient.professionalSkills
                ),
                promptApiBrokenFields: this.parseArray(
                    tempClient.promptApiBrokenFields
                )
            };
        }

        const user = await this.userRepository.findOne({
            where: {
                userId
            },
            relations: {
                jobRoles: true,
                tickets: true
            }
        });

        if (!user) {
            return null;
        }

        delete user.password;

        try {
            user.extras = JSON.parse(user.extras) || {};
            user.education = JSON.parse(user.education) || [];
            user.technicalSkills = JSON.parse(user.technicalSkills) || [];
            user.professionalSkills = JSON.parse(user.professionalSkills) || [];
            user.jobRoles = this.sortJobsByDateDescending(user.jobRoles);
        } catch (err) {
            this.logService.error(`fetchUserById ${err}`);
        }

        return convertClientCRMClientIntoIntraCRM(user);
    }

    private parseArray(value: string): any[] {
        try {
            const parsedValue = JSON.parse(value);
            return Array.isArray(parsedValue) ? parsedValue : [];
        } catch (error) {
            return [];
        }
    }

    async updateLastCallBookDate(userId: string) {
        const user = await this.userRepository.findOneBy({
            userId: userId
        });
        user.bookedAt = new Date();
        await this.userRepository.save(user);
    }

    /**
     * `adminFetchUsers()` returns the token that is being used by intra-crm backend to access spyre-crm backend
     * @returns The function adminFetchUsers returns a Promise that resolves to the an object containing token
     */
    async adminFetchUsers(
        pagination: PaginationDTO,
        query: AdminGetUsersQuery
    ) {
        // pagination stuff
        const skip = pagination.limit * (pagination.page - 1);
        const take = pagination.limit;

        try {
            const queryBuilder = this.userRepository.createQueryBuilder("user");

            // queryBuilder.andWhere("isActive = TRUE");

            queryBuilder.andWhere("role = :role", {
                role: query.role ?? "client"
            });

            if (query.unSigned) {
                queryBuilder.andWhere("cvLibEmail IS NULL");
            }

            if (query.search) {
                queryBuilder.andWhere(
                    new Brackets((qb) => {
                        qb.orWhere("firstName LIKE :search", {
                            search: `%${query.search}%`
                        });
                        qb.orWhere("lastName LIKE :search", {
                            search: `%${query.search}%`
                        });
                    })
                );
            }

            const totalUsers = await queryBuilder.getCount();
            const users = await queryBuilder
                .select([
                    "user.userId",
                    "user.firstName",
                    "user.lastName",
                    "user.location",
                    "user.email",
                    "user.phone",
                    "user.role",
                    "user.profileImageUrl",
                    "user.hasUploadedCV",
                    "user.jobTarget1",
                    "user.status",
                    "user.jobSector",
                    "user.createdAt",
                    "user.source",
                    "user.cvSpecialistId",
                    "user.targetRole",
                    "user.sector",
                    "user.purchased",
                    "user.valuatorSalary",
                    "user.keyWordScore",
                    "user.grammerScore"
                ])
                .skip(skip)
                .take(take)
                .orderBy("user.createdAt", "DESC")
                .getMany();

            const apiResponse: ApiResponseWithPagination<User[]> = {
                status: API_STATUS.SUCCESS,
                message: "Get User's Successful",
                data: users,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalUsers
                }
            };

            return apiResponse;
        } catch (err) {
            console.error("Failed to fetch clients. Error: ", err);
            throw new InternalServerErrorException(
                `An Error Occurred. please try again. Details: ${err}`
            );
        }
    }

    /**
     * Get the count of unsigned users based on specific criteria.
     * @returns {Promise<number>} - The count of unsigned users.
     */
    async getUnSignedUsersCount(): Promise<number> {
        try {
            const totalCount = await this.userRepository.count({
                where: this.getUnSignedUsersWhereClause()
            });

            return totalCount;
        } catch (error) {
            console.error("Failed to fetch unsigned users count", error);
            // Log the error and handle as needed
            throw new InternalServerErrorException(
                "Error fetching unsigned users count"
            );
        }
    }

    /**
     * Get unsigned users with specific criteria.
     * @param {PaginationDTO} pagination - Pagination options.
     * @returns {Promise<ApiResponseWithPagination<User[]>>} - A paginated response with unsigned users.
     */
    async getUnsignedUsers({
                               start,
                               limit
                           }: {
        start: number;
        limit: number;
    }): Promise<ApiResponseWithPagination2<User[]>> {
        try {
            console.log("getUnSignedUsers | Pagination", { start, limit });

            const users = await this.userRepository.find({
                where: this.getUnSignedUsersWhereClause(),
                skip: start,
                take: limit
            });

            return {
                status: API_STATUS.SUCCESS,
                message: "Unsigned users fetched successfully.",
                data: users,
                total: users.length
            };
        } catch (error) {
            console.error("Error fetching unsigned users", error);
            // Log the error and handle as needed
            throw new InternalServerErrorException(
                "Error fetching unsigned users"
            );
        }
    }

    async verifyEmailAddress(code: string) {
        const decoded = await this.jwtService.verify(code, {
            secret: process.env.EMAIN_VERIFICATION_SECRET
        });
        console.log("verifyEmailAddress | decoded: ", decoded);
        const user = await this.userRepository.findOneBy({
            userId: decoded.sub
        });
        if (!user) throw new NotFoundException("Could not find the user.");

        if (user.isEmailVerified)
            throw new UnauthorizedException(
                "The token is expired, email address is already changed."
            );

        user.email = user.tempEmail;
        user.tempEmail = null;
        user.isEmailVerified = true;
        await this.userRepository.save(user);
        console.log("Email address updated");
        return {
            message: "Email verified successfully."
        };
    }

    private getUnSignedUsersWhereClause = () => {
        return {
            firstName: Not(IsNull()),
            lastName: Not(IsNull()),
            jobTarget1: Not(IsNull()),
            postcode: Not(IsNull()),
            county: Not(IsNull()),
            location: Not(IsNull()),
            currentSalary: Not(IsNull()),
            phone: Not(IsNull()),
            hasUploadedCV: true,
            isActive: true,
            cvUrl: Not(IsNull()),
            cvLibEmail: IsNull(),
            reedEmail: IsNull()
        };
    };

    private sortJobsByDateDescending(jobList: JobRole[]) {
        const compareDates = (date1, date2) => {
            const [month1, year1] = date1.split(" ");
            const [month2, year2] = date2.split(" ");
            const months = {
                Jan: 1,
                Feb: 2,
                Mar: 3,
                Apr: 4,
                May: 5,
                Jun: 6,
                Jul: 7,
                Aug: 8,
                Sep: 9,
                Oct: 10,
                Nov: 11,
                Dec: 12
            };
            const yearComparison = parseInt(year2) - parseInt(year1); // Notice the difference here
            if (yearComparison !== 0) {
                return yearComparison;
            } else {
                return months[month2] - months[month1]; // Notice the difference here
            }
        };

        jobList.sort((job1, job2) => {
            if (job1.startDate === "Current") return -1;
            if (job2.startDate === "Current") return 1;
            return compareDates(job1.startDate, job2.startDate);
        });

        return jobList;
    }

    async sendPasswordResetEmail(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            // throw new NotFoundException("User not found");
            return { message: "Reset Password email send successfully" };
        }
        const token = await this.generateToken(user.userId); // Implement your own token generation logic
        const link = `${process.env.CLIENT_CRM_FRONTEND_BASE_URL}/passwordReset?token=${token}`;
        await this.emailSendingService
            .sendForgotPasswordEmail(
                user.email,
                user.firstName + " " + user.lastName,
                link
            )
            .then((res) => {
                console.log(`Reset password Email send to ${user.email}`);
            })
            .catch((err) => {
                this.logService.error(
                    `sendPasswordResetEmail:emailSendingServicerror ${err}`
                );
            });

        return { message: "Reset Password email send successfully" };
        // return link;
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            // Verify token
            console.log("reset password");
            const decodedToken = await this.jwtService.verify(token, {
                secret: process.env.AT_SECRET // Provide the secret key here
            });

            // Find user by ID
            const userId = decodedToken.userId;
            const user = await this.userRepository.findOne({
                where: { userId }
            });
            if (!user) {
                throw new NotFoundException("User not found");
            }

            // Update user's password
            const hashedPassword = await this.hashData(newPassword);
            user.password = hashedPassword;
            await this.userRepository.save(user);
            this.logService.info("Reset password successfully");
            return { message: "Reset password successfully" };
        } catch (error) {
            throw new UnauthorizedException("The link is expired");
        }
    }

    async generateToken(userId: string) {
        const [at] = await Promise.all([
            this.jwtService.sign(
                {
                    userId: userId
                },
                {
                    // secret: process.env.AT_SECRET,
                    // expiresIn: process.env.AT_EXPIRY,
                    secret: process.env.AT_SECRET,
                    expiresIn: "15m"
                    //15 minutes
                }
            )
        ]);
        return at;
    }
}
