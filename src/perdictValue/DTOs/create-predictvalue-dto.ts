import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePredictValueDto {
  @ApiProperty()
  @IsNotEmpty()
  file: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  target_role: string;

  @IsOptional()
  user_id?: string;
}
