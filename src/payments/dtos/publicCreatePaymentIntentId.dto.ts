import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsIn, IsArray, ArrayMinSize, IsOptional } from 'class-validator';

export class PublicCreatePaymentIntentDto {
  

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

  @ApiProperty({ description: 'Payment methods types' })
  @IsOptional()
  @IsArray()
  @IsString({
    each: true
  })
  @ArrayMinSize(1)
  paymentMethods: string[] = ['card'];
}
