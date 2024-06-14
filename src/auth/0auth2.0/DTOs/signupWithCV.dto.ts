import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class UploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @Type(() => Buffer)
  @IsNotEmpty()
  file: Buffer;
}
