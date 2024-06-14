import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Client Name' })
  @IsNotEmpty()
  @IsString()
  client_name: string;

  @ApiProperty({ description: 'Email Address' })
  @IsNotEmpty()
  @IsEmail()
  email_address: string;
}
