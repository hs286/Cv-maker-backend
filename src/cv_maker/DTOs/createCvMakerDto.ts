// create-cv-maker.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCvMakerDto {
  // @ApiProperty()
  // @IsNumber()
  // @IsOptional()
  // id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  api_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  command: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content: string;
}
