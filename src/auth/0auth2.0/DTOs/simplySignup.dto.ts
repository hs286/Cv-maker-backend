import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  IsString,
} from 'class-validator';

export class SimplySignupDTO {
  @ApiProperty({
    description: 'First Name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last Name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone Number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Password',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'CV Specialist ID',
  })
  cvSpecialist?: string;
}
