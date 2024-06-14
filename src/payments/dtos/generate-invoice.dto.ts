// generate-invoice.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsIn } from 'class-validator';

export class GenerateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  package_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ enum: ['one-off', 'subscription'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['one-off', 'subscription'])
  type: 'one-off' | 'subscription';
}
