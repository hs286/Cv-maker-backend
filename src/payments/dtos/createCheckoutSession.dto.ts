import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsIn, IsArray, ArrayMinSize, IsOptional, ValidateIf, IsEmail } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Checkout Session Mode', enum: ['payment',
    'subscription',
    'setup'] })
  @IsNotEmpty()
  @ValidateIf(dto => [
    'payment',
    'subscription',
    'setup'
  ].includes(dto.mode))
  @IsString()
  mode: string;

  @ApiProperty({ description: 'Package Name' })
  @IsNotEmpty()
  @IsString()
  package_name: string;

  @ApiProperty({ description: 'Package Details' })
  @IsNotEmpty()
  @IsString()
  package_details: string;

  @ApiProperty({ description: 'Price' })
  @IsNumber()
  price: number;
}
