import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJobDescriptionDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  job_title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  jd_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  job_description: string;

  @ApiProperty()
  @IsNotEmpty()
  cv: any;
}
