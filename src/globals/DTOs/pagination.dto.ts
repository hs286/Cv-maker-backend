import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumberString,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDTO {
  @ApiProperty({
    description: 'Page Number',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return parseInt(value);
  })
  @IsNumber()
  page: number = 1;

  @ApiProperty({
    description: 'Limit / Strength of the Page',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return parseInt(value);
  })
  @IsNumber()
  limit: number = 25;


}
