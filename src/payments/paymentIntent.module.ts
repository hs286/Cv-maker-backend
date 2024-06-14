import { Module } from '@nestjs/common';

import { PaymentIntentController } from './controllers/stripe.controller';
import { StripeService } from './services/stripe.service';
import { PurchaseHistoryController } from './controllers/purchase.controller';
import { UserModule } from 'src/user/user.module';
import { EmailsModule } from 'src/emails/emails.module';

@Module({
  controllers: [PaymentIntentController, PurchaseHistoryController],
  providers: [StripeService],
  imports: [UserModule],
  exports: [StripeService],
})
export class PaymentIntentModule {}
