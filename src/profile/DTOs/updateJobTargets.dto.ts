import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateJobTargetsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Current Salary',
    required: false,
  })
  currentSalary?: string;

  // @IsOptional()
  // @IsString()
  // @ApiProperty({
  //   description: 'Target Salary',
  //   required: false,
  // })
  // targetSalary?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Job Target',
    required: false,
  })
  jobTarget1?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Job Sector',
    required: false,
  })
  jobSector?: string;
}
