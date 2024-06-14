import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "../entities/job.entity";
import { ILike, Repository } from "typeorm";
import { Sector } from "../entities/sector.entity";
import { ConflictException, Injectable } from "@nestjs/common";
import { Location } from "../entities/location.entity";
import { JobCreateFormDto } from "../DTOs/jobCreateForm.dto";
import { LocationQueryDto } from "../DTOs/locationQuery.dto";
import { JobSectorQueryDto } from "../DTOs/jobSectorQuery.dto";
import { JobRoleQueryDto } from "../DTOs/jobRoleQuery.dto";

@Injectable()
export class MiseService {
    constructor(
        @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
        @InjectRepository(Sector)
        private readonly sectorRepository: Repository<Sector>,
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>
    ) {
    }

    async addJob(fromData: JobCreateFormDto) {
        const exists = await this.isJobUnique({
            title: fromData.title,
            type: fromData.type
        });

        if (!exists)
            throw new ConflictException(
                `Job title ${fromData.title} already exists.`
            );

        const job = new Job();
        job.type = fromData.type;
        job.title = fromData.title;

        return await this.jobRepository.save(job);
    }

    async isJobUnique({ id, title, type }: any) {
        const where: any = {
            title,
            type
        };
        if (id) {
            where.id = { $ne: id };
        }

        const count = await this.jobRepository.count({
            where
        });

        return !count;
    }

    async getJobs(queryData: JobRoleQueryDto) {
        const whereClause: any = {};

        if (queryData.search) {
            whereClause.title = ILike(`${queryData.search}%`);
        }

        if (queryData.type) {
            whereClause.type = queryData.type;
        }

        const [jobs, total] = await this.jobRepository.findAndCount({
            where: whereClause,
            take:
                !queryData.limit || queryData.limit === -1
                    ? 60
                    : queryData.limit,
            skip:
                !queryData.start || queryData.start === -1
                    ? 0
                    : queryData.start,
            order: { createdAt: "DESC" }
        });

        return {
            total,
            start: queryData.start,
            limit: queryData.limit,
            filtered: jobs.length,
            data: jobs
        };
    }

    async getLocations(queryData: LocationQueryDto) {
        const whereClause: any = {};

        if (queryData.search) {
            whereClause.county = ILike(`${queryData.search}%`);
        }

        const [locations, total] = await this.locationRepository.findAndCount({
            where: whereClause,
            take:
                !queryData.limit || queryData.limit === -1
                    ? 60
                    : queryData.limit,
            skip:
                !queryData.start || queryData.start === -1
                    ? 0
                    : queryData.start,
            order: { createdAt: "DESC" }
        });

        return {
            total,
            start: queryData.start,
            limit: queryData.limit,
            filtered: locations.length,
            data: locations
        };
    }

    async banglaGetSectors() {
        return this.sectorRepository.find();
    }

    async getSectors(queryData: JobSectorQueryDto) {
        const whereClause: any = {};

        if (queryData.search) {
            whereClause.title = ILike(`${queryData.search}%`);
        }

        const [sectors, total] = await this.sectorRepository.findAndCount({
            where: whereClause,
            take:
                !queryData.limit || queryData.limit === -1
                    ? 60
                    : queryData.limit,
            skip:
                !queryData.start || queryData.start === -1
                    ? 0
                    : queryData.start,
            order: { createdAt: "DESC" }
        });

        return {
            total,
            start: queryData.start,
            limit: queryData.limit,
            filtered: sectors.length,
            data: sectors
        };
    }
}
