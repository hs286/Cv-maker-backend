/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDTO {
  @IsNotEmpty({ message: 'Please provide a valid Password' })
  @IsString({ message: 'Invalid Password. must be valid string' })
  @MinLength(6, { message: 'Password must be 6 characters atleast' })
  @ApiProperty()
  password: string;

  @IsNotEmpty({ message: 'provide token' })
  @IsString({ message: 'provide token as string' })
  @ApiProperty()
  token: string;
}
