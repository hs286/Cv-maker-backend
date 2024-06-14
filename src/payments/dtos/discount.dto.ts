import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DiscountDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({ description: 'Discount Code' })
  @IsNotEmpty()
  @IsString()
  discount_code: string;

}
