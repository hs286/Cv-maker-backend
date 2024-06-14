import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LogService } from 'src/logger';
import { Package } from '../entities/package.entity';
import { Service } from '../../service/entities/service.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulkCreateServicesAndPackagesDto } from '../DTOs/bulk-create-services-and-packages-dto';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private logService: LogService,
  ) {}
  async getAll() {
    try {
      const data = await this.packageRepository
        .createQueryBuilder('package')
        .leftJoinAndSelect('package.services', 'service')
        .select(['package.id', 'package.name', 'package.price', 'service.id', 'service.name'])
        .getMany();

      return {
        message: 'Packages fetched successfully',
        statusCode: 200,
        data,
      };
    } catch (error) {
      this.logService.error(`[PackageService.getAll] ${error}`);
      return {
        messsage: error.message,
        statusCode: 500,
      };
    }
  }

  async createPackagesAndServices(data: BulkCreateServicesAndPackagesDto): Promise<{ message: string, statusCode: number }> {
    try {
      const { services, packages, packageServices } = data;
  
      // Create services
      await this.serviceRepository.save(services);
  
      // Create packages
      await this.packageRepository.save(packages);
  
      // Associate services with packages
      const packageServiceData = [];
      for (const { package_name, service_name } of packageServices) {
        const packageEntity = await this.packageRepository.findOne({
          where: { name: package_name },
        });
        const serviceEntity = await this.serviceRepository.findOne({
          where: { name: service_name },
        });
        if (!packageEntity || !serviceEntity) {
          throw new Error(`Package or service not found for ${package_name} or ${service_name}`);
        }
  
        // Check if service already exists in the package
        if (packageEntity?.services?.find(service => service.name === service_name)) {
          throw new Error(`Service ${service_name} already exists in package ${package_name}`);
        }
  
        packageEntity.services = [...(packageEntity.services || []), serviceEntity];
        packageServiceData.push(packageEntity);
      }
  
      // Reduce data to avoid duplicate package entries
      const reducedData = packageServiceData.reduce((acc, curr) => {
        const existingPackage = acc.find(item => item.id === curr.id);
        if (existingPackage) {
          // Package already exists, merge services
          existingPackage.services.push(...curr.services);
        } else {
          // Package does not exist, add it to the reduced data
          acc.push(curr);
        }
        return acc;
      }, []);
  
      // Save the reduced package data
      await this.packageRepository.save(reducedData);

      return {
        message: 'Packages and services created successfully',
        statusCode: 201,
      };

    } catch (error) {
      // Handle errors
      console.error("Error occurred:", error.message);
      throw error;
    }
  }

  async getPackageById(id: number) {
    try {
      const data = await this.packageRepository
        .createQueryBuilder('package')
        .leftJoinAndSelect('package.services', 'service')
        .where('package.id = :id', { id })
        .select(['package.id', 'package.name', 'package.price', 'service.id', 'service.name'])
        .getOne();

      return {
        message: 'Package fetched successfully',
        statusCode: 200,
        data,
      };
    } catch (error) {
      this.logService.error(`[PackageService.getPackageById] ${error}`);
      return {
        messsage: error.message,
        statusCode: 500,
      };
    }
  }
  

  // async createPackage(Package: Package) {
  //   try {
  //     return await this.PackageRepository.save(Package);
  //   } catch (error) {
  //     this.logService.error(`[UserPackage.createPackage] ${error}`);
  //     throw new InternalServerErrorException();
  //   }
  // }
}
