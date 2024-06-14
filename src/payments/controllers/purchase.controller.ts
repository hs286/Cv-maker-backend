import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StripeService } from '../services/stripe.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import Stripe from 'stripe';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/0auth2.0/guards';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('purchase-history')
@Controller('purchase-history')
export class PurchaseHistoryController {
  constructor(private readonly stripeService: StripeService) {}

  @Get('/')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getPurchaseHistory(@Req() req: Request): Promise<any> {
    return this.stripeService.getPurchaseHistory(req.user['sub']);
  }

  @Get('invoices')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getInvoicesByCustomerId(
    @Req() req: Request,
  ): Promise<Stripe.Invoice[]> {
    return this.stripeService.getInvoicesByCustomerId(req.user['sub']);
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getSubscriptionsByCustomerId(
    @Req() req: Request,
  ): Promise<Stripe.Subscription[]> {
    return this.stripeService.getSubscriptionsByCustomerId(req.user['sub']);
  }
}
