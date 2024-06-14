import { Module } from '@nestjs/common';
import { ServiceService } from './services/service.service';
import { ServiceController } from './controllers/service.controller';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServiceController],
  providers: [ServiceService, ConfigService, JwtService],
  exports: [ServiceService, TypeOrmModule.forFeature([Service])],
})
export class ServiceModule {}
