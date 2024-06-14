import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  price: number;
}

class PackageDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  price: number;
}

class PackageServiceDto {
  @ApiProperty()
  @IsNotEmpty()
  package_name: string;

  @ApiProperty()
  @IsNotEmpty()
  service_name: string;
}

export class BulkCreateServicesAndPackagesDto {
  @ApiProperty({ type: [ServiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @ApiProperty({ type: [PackageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages: PackageDto[];

  @ApiProperty({ type: [PackageServiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageServiceDto)
  packageServices: PackageServiceDto[];
}
