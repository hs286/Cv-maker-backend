import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Role as UserRole } from 'src/auth/0auth2.0/enums';
import { PaginationDTO } from 'src/globals/DTOs';

export class GetFilesQueryDto extends PaginationDTO {
  @ApiProperty({
    description: `Uploader's Role. Can be ${Object.values(UserRole).map(
      (v) => ' ' + v,
    )}. Multiple Values are comma Separated like ${
      Object.values(UserRole)[0]
    },${Object.values(UserRole)[1]}`,
    required: false,
  })
  @IsOptional()
  @IsString()
  uploadedBy?: string;
}
