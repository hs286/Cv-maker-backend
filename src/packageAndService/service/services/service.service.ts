import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';
import { Service } from '../entities/service.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    private configService: ConfigService,
    private logService: LogService,
  ) {}
  async getAll() {
    try {
      const data = await this.serviceRepository
        .createQueryBuilder('service')
        .select(['service.id', 'service.name', 'service.price'])
        .getMany();

      return {
        message: 'Services fetched successfully',
        statusCode: 200,
        data,
      };
    } catch (error) {
      this.logService.error(`[ServiceService.getAll] ${error}`);
      return {
        messsage: error.message,
        statusCode: 500,
      };
    }
  }

  async getServicesByIds(ids: number[]) {
    try {
      const data = await this.serviceRepository
        .createQueryBuilder('service')
        .select(['service.id', 'service.name', 'service.price'])
        .where('service.id IN (:...ids)', { ids })
        .getMany();

      return {
        message: 'Services fetched successfully',
        statusCode: 200,
        data,
      };
    } catch (error) {
      this.logService.error(`[ServiceService.getServicesByIds] ${error}`);
      return {
        messsage: error.message,
        statusCode: 500,
      };
    }
  }

  // async createService(service: Service) {
  //   try {
  //     return await this.serviceRepository.save(service);
  //   } catch (error) {
  //     this.logService.error(`[UserService.createService] ${error}`);
  //     throw new InternalServerErrorException();
  //   }
  // }
}
