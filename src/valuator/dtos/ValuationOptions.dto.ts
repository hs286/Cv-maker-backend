import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ValuatorOptionsDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
