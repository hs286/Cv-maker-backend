/* eslint-disable prettier/prettier */
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Valuator } from "../entities/valuator.entity";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    ConflictException,
    BadRequestException
} from "@nestjs/common";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { v4 as uuidv4 } from "uuid";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { LogService } from "src/logger";
import { WebSocketGate } from "src/websocket/websocket.gateway";

@Injectable()
export class ValuatorService {
    constructor(
        @InjectRepository(Valuator)
        public valuatorRepository: Repository<Valuator>,
        @InjectRepository(User) public userRepository: Repository<User>,
        @InjectRepository(CVProfile)
        public cvProfileRepository: Repository<CVProfile>,
        private webSocketGate: WebSocketGate,
        private httpService: HttpService,
        private configService: ConfigService,
        private logService: LogService
    ) {
    }

    /**
     * The `getCVEvaluationWithFile` function takes a user ID and a file as input, retrieves the user
     * from the database, checks if a valuation already exists for the user, makes an HTTP request to a
     * CV valuation API with the file and user information, and saves the valuation response in the
     * database.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of the user for whom the evaluation is being performed. It is used to retrieve the user from the
     * database and check if a valuation already exists for the user.
     * @param file - The `file` parameter is of type `Express.Multer.File`, which is an object
     * representing a file uploaded through a form. It contains information about the uploaded file, such
     * as its buffer, mimetype, and original name.
     * @returns the saved valuation object from the `valuatorRepository.save()` method.
     */
    async getCVEvaluationWithFile(userId: string, file: Express.Multer.File) {
        console.log(userId);
        const user = await this.userRepository.findOne({
            where: {
                userId
            }
        });
        if (!user) {
            throw new NotFoundException("No such user found");
        }

        if (!user?.jobTarget1) {
            throw new BadRequestException("User has no target role defined.");
        }

        if (!file) {
            throw new BadRequestException("File not found");
        }

        const isValuationExist = await this.valuatorRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });
        //todo: discuss with client.
        if (isValuationExist) {
            throw new ConflictException("Valuation already exists");
        }

        const apiKey = await this.configService.get("api.CVValuatorApiKey");
        console.log("API-KEY", apiKey);
        const apiUrl = `${await this.configService.get(
            "api.CVValuatorApiUrl"
        )}/predict_value`;

        // Convert the Buffer to a Blob
        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        // Create a FormData object to handle file upload
        const formData = new FormData();
        formData.append("file", fileBlob, file.originalname);
        // todo: discuss which job role target to include one or two
        formData.append("target_role", user?.jobTarget1);
        // todo: is current salary and recent salary the same?
        formData.append("recent_salary", user?.currentSalary);

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
            //   console.dir(response?.data, { depth: null });

            console.log("response in try block", response);

            const valuationResponse = response?.data;

            console.log("valuation Response", valuationResponse);
            //   store in valuation repo
            const valuation = new Valuator();
            valuation.valuatorId = uuidv4();
            // valuation.jobDescription = valuationResponse?.job_description;
            valuation.estimatedSalary = valuationResponse?.predicted;
            valuation.originalSalary = valuationResponse?.original;
            // valuation.score = valuationResponse?.ats_score;
            valuation.user = <any>{ userId };

            return await this.valuatorRepository.save(valuation);
        } catch (error) {
            this.logService.error(
                `getCVEvaluationWithFile:${error.toString() || error}`
            );
            throw new InternalServerErrorException(
                "An error occured, please try again."
            );
        }
    }

    /**
     * The function `getCVEvaluationUKWithFile` is an asynchronous function that takes a user ID and a
     * file as parameters, retrieves user and valuation data, makes an HTTP request to a CV valuation
     * API, and saves the valuation data in the database.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of the user for whom the evaluation is being performed.
     * @param file - The `file` parameter is of type `Express.Multer.File`, which is an object
     * representing a file uploaded through a form. It contains information about the uploaded file, such
     * as its buffer, mimetype, and original name.
     * @returns the saved valuation object from the `valuatorRepository.save()` method.
     */
    async getCVEvaluationUKWithFile(userId: string, file: Express.Multer.File) {
        console.log(userId);
        const user = await this.userRepository.findOne({
            where: {
                userId
            }
        });
        if (!user) {
            throw new NotFoundException("No such user found");
        }
        if (!user?.jobTarget1) {
            throw new BadRequestException("User has no target role defined.");
        }
        if (!file) {
            throw new BadRequestException("File not found");
        }

        const isValuationExist = await this.valuatorRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });
        //todo: discuss with client.
        if (isValuationExist) {
            throw new ConflictException("Valuation already exists");
        }

        const apiKey = await this.configService.get("api.CVValuatorApiKey");
        console.log("API-KEY", apiKey);
        const apiUrl = `${await this.configService.get(
            "api.CVValuatorApiUrl"
        )}/predict_value_all_locations`;

        // Convert the Buffer to a Blob
        const fileBlob = new Blob([file.buffer], { type: file.mimetype });

        // Create a FormData object to handle file upload
        const formData = new FormData();
        formData.append("file", fileBlob, file.originalname);
        formData.append("target_role", user?.jobTarget1);
        // todo: is current salary and recent salary the same? its optional
        formData.append("recent_salary", user?.currentSalary);

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
            //   console.dir(response?.data, { depth: null });

            const valuationResponse = response?.data;

            //   store in valuation repo
            const valuation = new Valuator();
            valuation.valuatorId = uuidv4();
            // valuation.jobDescription = valuationResponse?.job_description;
            valuation.estimatedSalary = valuationResponse?.predicted;
            valuation.originalSalary = valuationResponse?.original;
            // valuation.score = valuationResponse?.ats_score;
            valuation.user = <any>{ userId };

            return await this.valuatorRepository.save(valuation);
        } catch (error) {
            this.logService.error(
                `getCVEvaluationUKWithFile:${error.toString() || error}`
            );

            throw new InternalServerErrorException(
                "An error occured, please try again."
            );
        }
    }

    /**
     * The function `valuateProfile` retrieves a user's CV profile which is stored before making this call
     * It then checks if a valuation already exists, makes an API request to predict the value of the CV, and saves the valuation in
     * the database. There can be no evaluation without a CV response that has been stored in the db before.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of a user. It is used to retrieve the user's CV profile and check if a valuation already exists
     * for the user.
     * @returns the saved valuation object.
     */
    async valuateProfile(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });

        if (!user.jobTarget1) {
            throw new NotFoundException("Job target not found");
        }
        if (user.isCvValuatorProcessing) {
            throw new ConflictException(
                "Already Valuation processing happening."
            );
        }

        user.isCvValuatorProcessing = true;

        await this.userRepository.save(user);

        const userProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            },
            relations: {
                user: true
            }
        });

        if (!userProfile) {
            throw new NotFoundException(
                "No such user with such profile exists"
            );
        }
        if (!userProfile?.user?.jobTarget1) {
            throw new BadRequestException("No target role found for user");
        }

        const isValuationExist = await this.valuatorRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });

        //todo: discuss with client.
        if (isValuationExist) {
            await this.valuatorRepository.delete(isValuationExist.valuatorId);
        }

        const apiKey = await this.configService.get("api.CVValuatorApiKey");

        const apiUrl = `${await this.configService.get(
            "api.CVValuatorApiUrl"
        )}/predict_value_processed`;

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
        };

        const requestBody = {
            cv_data: userProfile?.CVProfileStringified,
            target_role: userProfile?.user.jobTarget1
            // recent_salary: userProfile?.user?.currentSalary
        };

        try {
            console.log("Calling CV Valuator", apiUrl, requestBody);
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            console.log("Response from CV Evaluator", apiUrl, response.status, response.data);

            const valuationResponse = response?.data;

            user.isCvValuatorProcessing = false;

            user.valuatorSalary = valuationResponse?.original;

            // api response
            const result = { userId, valuatorSalary: user.valuatorSalary };

            this.webSocketGate.sendToUserGetCvScore(userId, result);

            await this.userRepository.save(user);

            return result;
        } catch (error) {
            console.error(
                "Valuate Profile Error: ",
                error.response?.status,
                error.response?.data ?? JSON.stringify(error)
            );
            user.isCvValuatorProcessing = false;
            await this.userRepository.save(user);
            this.logService.error(
                `valuateProfile:${error.toString() || error}`
            );
            throw new InternalServerErrorException(
                "An error occurred, please try again."
            );
        }
    }

    /**
     * The function `valuateProfileUK` retrieves a user's CV profile, checks if a valuation
     * already exists, sends a request to a CV valuation API, and saves the valuation response in the
     * database.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of a user. It is used to retrieve the user's CV profile and check if a valuation already exists
     * for the user.
     * @returns the saved valuation object.
     */
    async valuateProfileUK(userId: string) {
        const userProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            },
            relations: {
                user: true
            }
        });
        if (!userProfile) {
            throw new NotFoundException(
                "No such user with such profile exists"
            );
        }
        if (!userProfile?.user?.jobTarget1) {
            throw new BadRequestException("No target role found for user");
        }

        const isValuationExist = await this.valuatorRepository.findOne({
            where: {
                user: {
                    userId
                }
            }
        });
        //todo: discuss with client.
        if (isValuationExist) {
            throw new ConflictException("Valuation already exists");
        }

        const apiKey = await this.configService.get("api.CVValuatorApiKey");
        console.log("API-KEY", apiKey);
        const apiUrl = `${await this.configService.get(
            "api.CVValuatorApiUrl"
        )}/predict_value_processed_all_locations`;

        const requestBody = {
            cv_data: userProfile?.CVProfileStringified,
            target_role: userProfile?.user.jobTarget1,
            recent_salary: userProfile?.user?.currentSalary
        };

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
            // timeout: 500000
        };

        try {
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            //   console.dir(response?.data, { depth: null });

            console.log("response in try block", response);

            const valuationResponse = response?.data;

            console.log("valuation Response", valuationResponse);
            //   store in valuation repo
            const valuation = new Valuator();
            valuation.valuatorId = uuidv4();
            // valuation.jobDescription = valuationResponse?.job_description;
            valuation.estimatedSalary = valuationResponse?.predicted;
            valuation.originalSalary = valuationResponse?.original;
            // valuation.score = valuationResponse?.ats_score;
            valuation.user = <any>{ userId };

            return await this.valuatorRepository.save(valuation);
        } catch (error) {
            this.logService.error(
                `valuateProfileUK:${error.toString() || error}`
            );
            throw new InternalServerErrorException(
                "An error occured, please try again."
            );
        }
    }

    // deprecate this endpoint.
    async getMedianSalaryByLocation(userId: string) {
        const valuation = await this.valuatorRepository.findOne({
            where: {
                user: {
                    userId
                }
            },
            relations: {
                user: true
            }
        });

        if (!valuation) {
            throw new NotFoundException(" valuation does not exist");
        }

        /*
    	"target_role": "...",
	    "location": location (can be both county or city)
     */

        const apiKey = await this.configService.get("api.CVValuatorApiKey");
        console.log("API-KEY", apiKey);
        const apiUrl = `${await this.configService.get(
            "api.CVValuatorApiUrl"
        )}/get_county_median`;

        const requestBody = {
            target_role: valuation?.user?.jobTarget1,
            location: valuation?.user?.location
        };

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
            // timeout: 500000
        };

        try {
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            //   console.dir(response?.data, { depth: null });

            console.log("response in try block", response);

            const valuationResponse = response?.data;

            console.log("valuation Response", valuationResponse);
            //   store in valuation repo
            valuation.countryMedian = valuationResponse?.result;
            valuation.user = <any>{ userId };

            return await this.valuatorRepository.save(valuation);
        } catch (error) {
            this.logService.error(
                `getMedianSalaryByLocation:${error.toString() || error}`
            );
            throw new InternalServerErrorException(
                "An error occured, please try again."
            );
        }
    }

    /**
     * The function `getMeanSalary` retrieves the mean salary for a specific user's job target from an
     * external API and saves it in the valuation repository.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of a user. It is used to find a valuation record associated with the user in the
     * `valuatorRepository`.
     * @returns the saved valuation object from the valuatorRepository.
     */
    async getMeanSalary(userId: string) {
        const valuation = await this.valuatorRepository.findOne({
            where: {
                user: {
                    userId
                }
            },
            relations: {
                user: true
            }
        });

        if (!valuation) {
            throw new NotFoundException(" valuation does not exist");
        }

        /*
    	"target_role": "...",
     */

        const apiKey = await this.configService.get("api.CVValuatorApiKey");
        console.log("API-KEY", apiKey);
        const apiUrl = `${await this.configService.get(
            "api.CVValuatorApiUrl"
        )}/get_country_mean`;

        const requestBody = {
            target_role: valuation?.user?.jobTarget1
            // location: valuation?.user?.location,
        };

        const config = {
            headers: {
                "api-key": apiKey,
                "Content-Type": "multipart/form-data"
            }
            // timeout: 500000
        };

        try {
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );
            //   console.dir(response?.data, { depth: null });

            console.log("response in try block", response);

            const valuationResponse = response?.data;

            console.log("valuation Response", valuationResponse);
            //   store in valuation repo
            valuation.countryMedian = valuationResponse?.result;
            valuation.user = <any>{ userId };

            return await this.valuatorRepository.save(valuation);
        } catch (error) {
            this.logService.error(`getMeanSalary:${error.toString() || error}`);
            throw new InternalServerErrorException(
                "An error occured, please try again."
            );
        }
    }

    async getAllScoresFromCV(userId: string) {
        // search the cv profile of the user. if found , make the api call
        const userCVProfile = await this.cvProfileRepository.findOne({
            where: {
                user: {
                    userId
                }
            },
            relations: {
                user: {
                    jobRoles: true,
                    valuator: true
                }
            }
        });

        if (!userCVProfile) {
            throw new NotFoundException("No CV profile found for this user.");
        }
        // API call to get scores keyword score and grammar score.

        const apiKey = `Basic ${await this.configService.get("api.ATSApiKey")}`;
        const apiUrl = `${await this.configService.get("api.ATSBaseUrl")}/score`;

        const requestBody = {
            data: JSON.parse(userCVProfile?.CVProfileStringified),
            user_id: userCVProfile?.user?.userId,
            job_title: userCVProfile?.user?.jobTarget1
        };

        const config = {
            headers: {
                Authorization: apiKey
            }
            // timeout: 500000
        };

        try {
            // Make the HTTP request using Axios and firstValueFrom to handle the Observable
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, config)
            );

            const apiResponse = response?.data;

            const user = await this.userRepository.findOne({
                where: {
                    userId: userId
                }
            });

            if (user) {
                // Update the properties of the user entity
                user.keyWordScore = apiResponse?.objects?.keywords_score;
                user.grammerScore = apiResponse?.objects?.grammar_score;
                await this.userRepository.save(user);
            } else {
                console.error("Valuator not found for the specified user.");
            }

            this.webSocketGate.sendToUserValuateProfile(userId, apiResponse);
            return apiResponse;
        } catch (error) {
            // console.log('getScoresFromCV', error);
            this.logService.error(
                `getAllScoresFromCV:${error.toString() || error}`
            );
            throw new InternalServerErrorException(
                `Something went wrong. Details: ${error?.toString() || error}`
            );
        }
    }

    /**
     * The function retrieves a user's valuation from a database based on their user ID.
     * @param {string} userId - The `userId` parameter is a string that represents the unique identifier
     * of a user.
     * @returns a Promise that resolves to a Partial<Valuator> object.
     */
    async getUserValuationFromDB(userId: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: {
                userId: userId
            }
        });

        const res = { userId, valuatorSalary: user.valuatorSalary };

        if (!user.valuatorSalary) {
            const res = await this.valuateProfile(userId);
            return res;
        }

        this.webSocketGate.sendToUserValuateProfile(userId, res);
        return res;
    }

    sendFetchuserprofileSocketEvent(userId: string, data: any) {
        this.webSocketGate.sendFetchuserprofile(userId, data);
    }
}
