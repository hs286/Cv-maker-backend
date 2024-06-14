import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

export class PayNowDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  packageName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  packageDetails: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;
}
