import { Module } from '@nestjs/common';
import { PackageService } from './services/package.service';
import { PackageController } from './controllers/package.controller';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { ServiceModule } from '../service/service.module';

@Module({
  imports: [TypeOrmModule.forFeature([Package]), ServiceModule],
  controllers: [PackageController],
  providers: [PackageService, JwtService],
  exports: [PackageService],
})
export class PackageModule {}
