import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateWorkHistoryDto {
  @ApiProperty()
  @IsString()
  jobTitle: string;

  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsArray()
  achievements: string[];

  @ApiProperty()
  @IsArray()
  responsibilities: string[];
}
