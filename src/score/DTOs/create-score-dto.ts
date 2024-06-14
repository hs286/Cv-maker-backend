import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateScoreDto {
  @ApiProperty()
  @IsNotEmpty()
  data: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  job_title: string;

  @IsOptional()
  user_id?: string;
}
