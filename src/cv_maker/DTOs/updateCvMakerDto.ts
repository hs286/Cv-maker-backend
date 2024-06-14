// update-cv-maker.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCvMakerDto } from './createCvMakerDto';

export class UpdateCvMakerDto extends PartialType(CreateCvMakerDto) {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: number;
}
