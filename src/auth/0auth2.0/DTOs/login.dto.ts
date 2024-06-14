import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LogInDTO {
  @IsNotEmpty({ message: 'Please provide a valid email' })
  @IsString({ message: 'Please provide email as a string' })
  @IsEmail()
  @ApiProperty({ example: '_@_.com' })
  email: string;

  @IsNotEmpty({ message: 'Please provide a valid Password' })
  @IsString({ message: 'Invalid Password. must be valid string' })
  @MinLength(6, { message: 'Password must be 6 characters atleast' })
  @ApiProperty()
  password: string;
}
