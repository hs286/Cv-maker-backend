// PaymentIntentController
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Headers,
  Query,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../services/stripe.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GenerateInvoiceDto } from '../dtos/generate-invoice.dto';
import { DiscountDto } from '../dtos/discount.dto';
import { PayNowDto } from '../dtos/payNow.dto';
import { SubscribeNowDto } from '../dtos/subscribeNow.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentIntentDto } from '../dtos/createPaymentIntentId.dto';
import { PublicCreatePaymentIntentDto } from '../dtos/publicCreatePaymentIntentId.dto';
import { CreateCheckoutSessionDto } from '../dtos/createCheckoutSession.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentIntentController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('pay-now')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async payNow(@Body() body: PayNowDto) {
    await this.stripeService.payNow(body);
  }

  @Get('customer-payments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiQuery({ name: 'startAfter', required: false })
  async getCustomerPayments(
    @Req() req: Request,
    @Query() query: { startAfter: string },
  ) {
    return await this.stripeService.getCustomerPayments(
      req.user['sub'],
      query.startAfter,
    );
  }

  @Get('products')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiQuery({ name: 'startAfter', required: false })
  async getProducts(@Query() query: { startAfter: string }) {
    return await this.stripeService.getProducts(query.startAfter);
  }

  @Post('subscribe-now')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async subscribeNow(@Body() body: SubscribeNowDto) {
    await this.stripeService.subscribeNow(body);
  }

  @Post('create-checkout-session')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createCheckoutSession(@Req() req: Request, @Body() body: CreateCheckoutSessionDto ) {
    const domainURL: string = `${req.headers.origin || req.headers.referer}`
    return await this.stripeService.createCheckoutSession({
      mode: body.mode,
      domainURL,
      packageName: body.package_name,
      packageDetails: body.package_details,
      price: body.price,
      clientName: body.clientName,
      email: body.email,
    });
  }


  @Post('create-intent')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createIntent(@Body() body: PublicCreatePaymentIntentDto) {
    return await this.stripeService.publicCreatePaymentIntent({
      packageName: body.package_name,
      packageDetails: body.package_details,
      price: body.price,
      type: body.type,
      paymentMethods: body.paymentMethods
    });
  }

  @Post('generate-invoice')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(@Body() createInvoiceDto: GenerateInvoiceDto) {
    try {
      const {
        customer_id: customerId,
        package_name: packageName,
        type,
      } = createInvoiceDto;
      const invoice = await this.stripeService.createInvoice(
        customerId,
        packageName,
        type,
      );
      return {
        invoiceId: invoice?.invoiceId,
        invoiceDetails: invoice?.invoiceDetails,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('send-receipt')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async sendReceipt(
    @Body('invoice_id') invoice_id: string,
  ): Promise<{ receiptStatus: string }> {
    try {
      if (!invoice_id) {
        throw new Error('Invoice ID is missing.');
      }
      const receiptStatus = await this.stripeService.sendInvoiceReceipt(
        invoice_id,
      );
      return receiptStatus;
    } catch (error) {
      throw new Error(`Error sending invoice receipt: ${error.message}`);
    }
  }

  @Post('apply-discount-code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @Post('apply-discount-code')
  async applyCouponToCustomer(
    @Body() discountDto: DiscountDto,
  ): Promise<number> {
    try {
      const adjustedAmount = await this.stripeService.applyCouponToCustomer(
        discountDto.customer_id,
        discountDto.discount_code,
      );
      return adjustedAmount;
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return await this.stripeService.handleWebhookEvent(body, signature);
  }

  @Get('discounts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getCoupons() {
    return await this.stripeService.getCoupons();
  }
}
