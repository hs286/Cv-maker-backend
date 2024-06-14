// createPaymentIntent.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class ConfirmPaymentDto {
        @ApiProperty({ description: 'Payment Intent ID' })
        @IsNotEmpty()
        @IsString()
        payment_intent_id: string;
     }
