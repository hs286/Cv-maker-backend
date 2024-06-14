import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateEducationHistoryDto {
  @ApiProperty()
  @IsString()
  educationLevel: string;

  @ApiProperty()
  @IsString()
  fieldOfStudy: string;

  @ApiProperty()
  @IsString()
  institutionName: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;
}
