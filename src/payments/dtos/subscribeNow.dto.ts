import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PaymentCardDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  number: string;
  @ApiProperty()
  @IsNumber()
  exp_month: number;
  @ApiProperty()
  @IsNumber()
  exp_year: number;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cvc: string;
}

export class PaymentMethodDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;
  @ApiProperty()
  card: PaymentCardDetails;
}

export class SubscribeNowDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiProperty()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsOptional()
  packageName: string;

  @ApiProperty()
  @IsOptional()
  packageDetails: string;

  @ApiProperty()
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsOptional()
  productId?: string;
}
