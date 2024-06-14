import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsIn } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({ description: 'Package Name' })
  @IsNotEmpty()
  @IsString()
  package_name: string;

  @ApiProperty({ description: 'Package Details' })
  @IsNotEmpty()
  @IsString()
  package_details: string;

  @ApiProperty({ description: 'Price' })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Type', enum: ['one-off', 'subscription'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['one-off', 'subscription'])
  type: 'one-off' | 'subscription';
}
