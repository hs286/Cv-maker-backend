import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean } from "class-validator";
import { Role as UserRole } from '../enums';

export class AdminGetUsersQuery {
  @ApiProperty({
    description: `User's Role. Can be ${Object.values(UserRole).map(
      (v) => ' ' + v,
    )}`,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'A keyword to search for in the job title.',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Is client already signed up or not',
    required: false,
  })
  @IsOptional()
  unSigned?: boolean;
}
