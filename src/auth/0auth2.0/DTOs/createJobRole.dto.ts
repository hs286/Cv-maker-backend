import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateJobRoleDto {
  @ApiProperty({
    description: 'Company Name',
  })
  @IsDateString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Start Date (Month and Year)',
  })
  @IsString()
  @IsNotEmpty()
  startDate: string; // Store as a string in "YYYY-MM" format

  @ApiProperty({
    description: 'End Date (Month and Year)',
  })
  @IsDateString()
  @IsOptional()
  endDate: string; // Store as a string in "YYYY-MM" format

  @ApiProperty({
    description: 'Job Title',
  })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({
    description: 'Additional Details',
  })
  @IsString()
  @IsOptional()
  additionalDetails: string;
}
