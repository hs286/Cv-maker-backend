import { ApiProperty } from '@nestjs/swagger';

export class StripeWebhookDto {
  @ApiProperty({description:'Event type sent by Stripe'})
  type: string;
}
