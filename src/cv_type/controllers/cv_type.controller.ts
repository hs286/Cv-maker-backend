import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards
} from "@nestjs/common";

import { CvTypeService } from "../services/cv_type.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtGuard, RoleGuard } from "src/auth/0auth2.0/guards";
import { Role } from "src/auth/0auth2.0/enums";
import { CreateCvTypeDto } from "../DTOs/createCvTypeDto";
import { UpdateAwardsDto } from "src/profile/DTOs/updateAwards.dto";

@ApiTags("CV Type")
@Controller("cv-type")
@ApiBearerAuth()
export class CvTypeController {
    constructor(private readonly cvTypeService: CvTypeService) {
    }

    @Get()
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async getAll() {
        return await this.cvTypeService.getAllCvTypes();
    }

    @Post()
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async create(@Body() cvTypeDto: CreateCvTypeDto) {
        return await this.cvTypeService.create(cvTypeDto);
    }

    @Patch(":id")
    @UseGuards(JwtGuard, RoleGuard(Role.ADMIN))
    async update(@Body() cvTypeDto: CreateCvTypeDto, @Param("id") id: number) {
        return await this.cvTypeService.update({ ...cvTypeDto, id });
    }
}

const isJSON = (str: string) => {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
};
