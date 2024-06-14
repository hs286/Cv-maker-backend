import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({ description: 'Package Details including subscription_plan_id' })
  @IsNotEmpty()
  @IsString()
  package_details: string;

  @ApiProperty({ description: 'Package description.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Payment Method ID' })
  @IsNotEmpty()
  @IsString()
  payment_method_id: string;
}
