import {
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateCvTypeDto } from "../DTOs";
import { Cv_Type } from "../entities/cv_type.entity";
import { LogService } from "src/logger";
import { Repository } from "typeorm";
import { CreateCvTypeDto } from "../DTOs/createCvTypeDto";

@Injectable()
export class CvTypeService {
    constructor(
        @InjectRepository(Cv_Type)
        private cvTypeRepository: Repository<Cv_Type>,
        private logService: LogService
    ) {
    }

    async create(body: CreateCvTypeDto): Promise<Cv_Type> {
        try {
            const cvType = await this.cvTypeRepository.save(body);
            return cvType;
        } catch (error) {
            this.logService.error(error);
            throw new InternalServerErrorException("Internal Server Error");
        }
    }

    async update(body: UpdateCvTypeDto): Promise<Cv_Type> {
        try {
            const cvType = await this.cvTypeRepository.findOne({
                where: { id: body.id }
            });

            if (!cvType) {
                throw new NotFoundException("CV Type not found");
            }

            const updatedCvType = await this.cvTypeRepository.save({
                ...cvType,
                ...body
            });

            return updatedCvType;
        } catch (error) {
            this.logService.error(error);
            throw new InternalServerErrorException("Internal Server Error");
        }
    }

    async getAllCvTypes(): Promise<Cv_Type[]> {
        return this.cvTypeRepository.find();
    }
}
