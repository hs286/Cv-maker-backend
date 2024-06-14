import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class AttachPaymentMethodDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({ description: 'Payment Method Details' })
  @IsNotEmpty()
  @IsObject()
  payment_method_details: Record<string, any>; // Adjust the type based on your specific payment method details
}
