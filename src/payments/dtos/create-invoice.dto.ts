// create-invoice.dto.ts

import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  packageName: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  type: string;
}
