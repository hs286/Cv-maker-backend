import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import { UserService } from "src/user/service/user.service";
import { LogService } from "src/logger";
import { PayNowDto, PaymentMethodDetails } from "../dtos/payNow.dto";
import { CustomerPayment } from "../dtos/customerPayment.dto";
import { SubscribeNowDto } from "../dtos/subscribeNow.dto";
// import { EmailSendingService } from "src/emails/services/email.service";

@Injectable()
export class StripeService {
    private readonly stripe: Stripe;

    constructor(
        private logService: LogService,
        private userService: UserService,
        private readonly configService: ConfigService,
        // private emailService: EmailSendingService,
    ) {
        const stripeSecretKey =
            this.configService.get<string>("STRIPE_SECRET_KEY");
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: null as any,
        });
    }

    private async getCustomerId(email: string): Promise<string> {
        try {
            const user = await this.userService.findUserByEmail(email);

            return user.stripeCustomerId;
        } catch (error) {
            this.logService.error(`[StripeService.getCustomerId] ${error}`);

            throw new Error();
        }
    }

    public async getCustomerByEmail(email: string): Promise<Stripe.Customer> {
        try {
            const user = await this.stripe.customers.list({
                email,
            });

            if (user?.data?.length) {
                return user.data[0];
            } else {
                return null;
            }
        } catch (error) {
            this.logService.error(
                `[StripeService.getCustomerByEmail] ${error}`,
            );

            throw new Error();
        }
    }

    public async createCustomer(
        clientName: string,
        email: string,
    ): Promise<string> {
        try {
            const customer = await this.stripe.customers.create({
                name: clientName,
                email,
            });

            return customer.id;
        } catch (error) {
            this.logService.error(`[StripeService.createCustomer] ${error}`);

            throw new Error();
        }
    }

    private async attachPaymentMethod(
        customerId: string,
        paymentMethodId: string,
    ): Promise<string> {
        try {
            await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });

            await this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            return paymentMethodId;
        } catch (error) {
            this.logService.error(
                `[StripeService.attachPaymentMethod] ${error}`,
            );

            throw new Error();
        }
    }

    async createInvoiceItemsAndInvoice({
        stripeCustomerId: customerId,
        invoiceItems: items,
        discount,
        currency = "GBP",
    }) {
        if (discount) {
            await this.stripe.customers.update(customerId, {
                coupon: discount,
            });
        }

        const invoice = await this.stripe.invoices.create({
            currency,
            customer: customerId,
            collection_method: "send_invoice",
            auto_advance: true,
            due_date: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 * 2, // 2 weeks
        });
        const srvInvLines = await Promise.all(
            items.map(async (item) =>
                this.stripe.invoiceItems.create({
                    customer: customerId,
                    amount: item.amount * 100, // Amount in cents
                    currency: item.currency || "GBP",
                    description: item.name,
                    invoice: invoice.id,
                }),
            ),
        );

        const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
            invoice.id,
        );

        const invoiceUrl = finalizedInvoice.hosted_invoice_url;

        return {
            invoiceUrl,
        };
    }

    private async createPaymentIntent(
        customerId: string,
        packageName: string,
        packageDetails: string,
        price: number,
        type: string,
    ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                customer: customerId,
                description: `Payment for Invoice`,
                amount: price * 100, // cents
                currency: "GBP",
                payment_method_types: ["card"], //accepted payment methods
                metadata: {
                    package_name: packageName,
                    package_details: packageDetails,
                    type: type,
                },
            });

            return paymentIntent;
        } catch (error) {
            this.logService.error(
                `[StripeService.createPaymentIntent] ${error}`,
            );

            throw new Error();
        }
    }

    async createCheckoutSession({
        mode,
        domainURL,
        packageName,
        packageDetails,
        price,
        clientName,
        email,
    }): Promise<{ session: string }> {
        try {
            // const paymentMethodId = await this.confirmPaymentIntent(paymentIntentId);

            let customerId = await this.getCustomerId(email);

            console.log("Customer ID: " + customerId || "----");
            if (!customerId) {
                customerId = await this.createCustomer(clientName, email);

                console.log("Customer ID: " + customerId || "----");
                await this.userService.updateUserStripeCustomerId(
                    email,
                    customerId,
                );
            }

            let productId;
            const products = await this.stripe.products.list({
                limit: 50,
            });

            if (products?.data?.length) {
                const calculatedPackage = products.data.find((item) => {
                    return item.name === packageName;
                });

                productId = calculatedPackage?.id;
            }

            if (!productId) {
                productId = await this.createSubscriptionProduct(
                    packageName,
                    packageDetails,
                );
            }

            const session = await this.stripe.checkout.sessions.create({
                mode: "payment",
                payment_method_types:
                    mode === "payment"
                        ? ["card", "paypal"]
                        : ["paypal", "klarna"],
                customer: customerId,
                line_items: [
                    {
                        price_data: {
                            currency: "GBP",
                            unit_amount: Number((price * 100).toFixed(0)),
                            product: productId,
                        },
                        quantity: 1,
                    },
                ],
                // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
                success_url: `${domainURL}/settings?payment_intent={CHECKOUT_SESSION_ID}`,
                cancel_url: `${domainURL}/settings`,
            });

            return {
                session: session.url,
            };
        } catch (error) {
            this.logService.error(
                `[StripeService.createCheckoutSession] ${error}`,
            );

            throw new Error();
        }
    }

    async publicCreatePaymentIntent({
        packageName,
        packageDetails,
        price,
        type,
        paymentMethods = ["card"],
    }: {
        packageName: string;
        packageDetails: string;
        price: number;
        type: string;
        paymentMethods?: string[];
    }): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                description: `Payment for Invoice`,
                amount: Number((price * 100).toFixed(2)), // cents
                currency: "GBP",
                payment_method_types: paymentMethods, //accepted payment methods
                ...(type === "subscription"
                    ? { setup_future_usage: "off_session" }
                    : {}),
                metadata: {
                    package_name: packageName,
                    package_details: packageDetails,
                    type,
                },
            });

            return paymentIntent;
        } catch (error) {
            this.logService.error(
                `[StripeService.publicCreatePaymentIntent] ${error}`,
            );

            throw new Error();
        }
    }

    private async confirmPaymentIntent(
        paymentIntentId: string,
        paymentMethod: string,
    ): Promise<string> {
        try {
            const intent = await this.stripe.paymentIntents.confirm(
                paymentIntentId,
                {
                    setup_future_usage: "off_session",
                },
            );

            let t: Stripe.PaymentIntentConfirmParams;
            return intent.payment_method as string;
        } catch (error) {
            this.logService.error(
                `[StripeService.confirmPaymentIntent] ${error}`,
            );

            throw new Error();
        }
    }

    private async createSubscriptionProduct(
        packageName: string,
        packageDetails: string,
    ): Promise<string> {
        try {
            const product = await this.stripe.products.create({
                name: packageDetails,
                metadata: {
                    package_name: packageName,
                    package_details: packageDetails,
                    type: "Custom",
                },
            });

            return product.id;
        } catch (error) {
            this.logService.error(
                `[StripeService.createSubscriptionProduct] ${error}`,
            );

            throw new Error();
        }
    }

    private async createSubscription(
        customerId: string,
        price: number,
        productId: string,
        // paymentMethodId: string,
    ) {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                // default_payment_method: paymentMethodId,
                description: "Installments For Package: " + productId,
                // default_payment_method: paymentMethodId,
                payment_settings: {
                    payment_method_types: ["card"],
                },
                items: [
                    {
                        price_data: {
                            currency: "GBP",
                            unit_amount: Number((price * 100).toFixed(0)),
                            recurring: {
                                interval: "month",
                            },
                            product: productId,
                        },
                    },
                ],
            });

            return {
                subscriptionId: subscription.id,
                subscriptionDetails: subscription,
            };
        } catch (error) {
            this.logService.error(
                `[StripeService.createSubscription] ${error}`,
            );

            throw new Error();
        }
    }

    async payNow(dto: PayNowDto): Promise<void> {
        const {
            clientName,
            email,
            paymentIntentId,
            paymentMethod,
            price,
            packageName,
            packageDetails,
        } = dto;
        let customerId = await this.getCustomerId(email);
        console.log("Customer ID: " + customerId || "----");

        if (!customerId) {
            customerId = await this.createCustomer(clientName, email);

            console.log("Customer ID: " + customerId || "----");
            await this.userService.updateUserStripeCustomerId(
                email,
                customerId,
            );
        }

        const paymentMethodId = await this.confirmPaymentIntent(
            paymentIntentId,
            paymentMethod,
        );

        await this.attachPaymentMethod(customerId, paymentMethodId);
    }

    async subscribeNow(dto: SubscribeNowDto): Promise<void> {
        const {
            clientName,
            email,
            paymentIntentId,
            paymentMethod,
            price,
            packageName,
            packageDetails,
        } = dto;
        let { productId } = dto;

        // const paymentMethodId = await this.confirmPaymentIntent(paymentIntentId);

        let customerId = await this.getCustomerId(email);

        console.log("Customer ID: " + customerId || "----");
        if (!customerId) {
            customerId = await this.createCustomer(clientName, email);

            console.log("Customer ID: " + customerId || "----");
            await this.userService.updateUserStripeCustomerId(
                email,
                customerId,
            );
        }

        /* await this.attachPaymentMethod(
      customerId,
      paymentMethodId,
    ); */
        const products = await this.stripe.products.list({
            limit: 50,
        });

        if (products?.data?.length) {
            const calculatedPackage = products.data.find((item) => {
                return item.name === packageName;
            });

            productId = calculatedPackage?.id;
        }

        if (!productId) {
            productId = await this.createSubscriptionProduct(
                packageName,
                packageDetails,
            );
        }

        await this.createSubscription(
            customerId,
            price,
            productId,
            // paymentMethodId,
        );
    }

    async getCustomerPayments(
        userId: string,
        startAfter: string,
    ): Promise<CustomerPayment[]> {
        const user = await this.userService.findByUserId(userId);
        const customerId = user?.stripeCustomerId;

        if (!customerId) {
            throw new BadRequestException();
        }

        try {
            const query = {
                customer: customerId,
            } as any;

            if (startAfter) {
                query.starting_after = startAfter;
            }

            const charges = await this.stripe.charges.list(query);

            if (charges?.data?.length) {
                return charges.data.map<CustomerPayment>((item) => {
                    return {
                        amount: item.amount / 100,
                        amountCaptured: item.amount_captured / 100,
                        chargeId: item.id,
                        created: item.created,
                        currency: item.currency,
                        receiptUrl: item.receipt_url,
                        status: item.status,
                    };
                });
            }

            return [];
        } catch (error) {
            this.logService.error(
                `[StripeService.getCustomerPayments] ${error}`,
            );

            throw new InternalServerErrorException();
        }
    }

    async getProducts(startAfter: string) {
        try {
            const query = {
                limit: 50,
            } as any;

            if (startAfter) {
                query.starting_after = startAfter;
            }

            const products = await this.stripe.products.list(query);

            if (products?.data?.length) {
                return products.data.map((item) => {
                    return {
                        id: item.id,
                        metadata: item.metadata,
                        name: item.name,
                    };
                });
            }

            return [];
        } catch (error) {
            this.logService.error(`[StripeService.getProducts] ${error}`);

            throw new InternalServerErrorException();
        }
    }

    // Old code

    async createSubscription_Old(
        customerId: string,
        description: string,
        packageDetails: string,
        paymentMethodId: string,
    ): Promise<{ subscriptionId: string; subscriptionDetails: any }> {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                default_payment_method: paymentMethodId,
                description: description,
                items: [
                    {
                        price: packageDetails,
                    },
                ],
            });
            return {
                subscriptionId: subscription.id,
                subscriptionDetails: subscription,
            }; // Return the created subscription ID and details
        } catch (error) {
            throw error;
        }
    }

    async createInvoice(
        customerId: string,
        packageName: string,
        type: string,
    ): Promise<
        { invoiceId: string; invoiceDetails: Stripe.Invoice } | undefined
    > {
        try {
            const dueDate = new Date(); // Set your preferred due date here
            const invoice = await this.stripe.invoices.create({
                currency: "GBP",
                customer: customerId,
                auto_advance: true,
                collection_method: "send_invoice",
                due_date: Math.floor(dueDate.getTime() / 1000),
                description: packageName,
                metadata: { type },
            });
            return {
                invoiceId: invoice.id,
                invoiceDetails: invoice,
            };
        } catch (error) {
            console.error("Error creating invoice:", error);
            return undefined;
        }
    }

    async sendInvoiceReceipt(
        invoiceId: string,
    ): Promise<{ receiptStatus: string }> {
        console.log(invoiceId);
        try {
            const sentReceipt =
                await this.stripe.invoices.sendInvoice(invoiceId);
            const receiptStatus = sentReceipt ? "sent" : "failed";
            return { receiptStatus };
        } catch (error) {
            throw new Error(`Error sending invoice receipt: ${error.message}`);
        }
    }

    async handleWebhookEvent(body: any, signature: string): Promise<any> {
        let event: Stripe.Event;

        // try {
        //   event = this.stripe.webhooks.constructEvent(
        //     body,
        //     signature,
        //     process.env.STRIPE_WEBHOOK_SECRET,
        //   );
        // } catch (err) {
        //   throw new Error(`Webhook Error: ${err.message}`);
        // }

        switch (body.type) {
            case "payment_intent.succeeded":
                console.log({
                    event,
                });
                this.userService.updatePaymentStatus({
                    stripeCustomerId: body?.data?.object?.customer,
                    paymentStatus: "paid",
                });
                break;
            case "payment_intent.payment_failed":
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }

    async getInvoicesByCustomerId(userId: string): Promise<Stripe.Invoice[]> {
        const user = await this.userService.findByUserId(userId);
        const customerId = user?.stripeCustomerId;

        if (!customerId) {
            throw new BadRequestException();
        }

        try {
            const invoices = await this.stripe.invoices.list({
                customer: customerId,
            });
            return invoices.data;
        } catch (error) {
            throw new Error(`Failed to fetch invoices: ${error.message}`);
        }
    }

    async getSubscriptionsByCustomerId(
        userId: string,
    ): Promise<Stripe.Subscription[]> {
        const user = await this.userService.findByUserId(userId);
        const customerId = user?.stripeCustomerId;

        if (!customerId) {
            throw new BadRequestException();
        }

        try {
            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
            });
            return subscriptions.data;
        } catch (error) {
            throw new Error(`Failed to fetch subscriptions: ${error.message}`);
        }
    }

    async getPurchaseHistory(userId: string): Promise<any> {
        const user = await this.userService.findByUserId(userId);
        const customerId = user?.stripeCustomerId;

        if (!customerId) {
            throw new BadRequestException(
                "User does not have a Stripe customer ID",
            );
        }

        try {
            const charges = await this.stripe.charges.list({
                customer: customerId,
            });

            const invoices = await this.stripe.invoices.list({
                customer: customerId,
            });

            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
            });
            return {
                charges: charges.data,
                invoices: invoices.data,
                subscriptions: subscriptions.data,
            };
        } catch (error) {
            throw new Error(
                `Failed to fetch purchase history: ${error.message}`,
            );
        }
    }

    async applyCouponToCustomer(
        customerId: string,
        couponCode: string,
    ): Promise<number> {
        try {
            const retrievedCustomer =
                await this.stripe.customers.retrieve(customerId);

            // Check if the retrievedCustomer is a Customer and has subscriptions
            if (
                "object" === typeof retrievedCustomer &&
                "subscriptions" in retrievedCustomer &&
                retrievedCustomer.subscriptions?.data.length
            ) {
                const customer = retrievedCustomer as Stripe.Customer; // Adjust based on your Stripe Customer type

                const coupon = await this.stripe.coupons.retrieve(couponCode);
                const subscriptionId = customer.subscriptions.data[0].id;
                const subscription =
                    await this.stripe.subscriptions.retrieve(subscriptionId);

                const adjustedAmount =
                    subscription.items.data[0].price.unit_amount;
                const discount = coupon.percent_off
                    ? coupon.percent_off / 100
                    : 0;
                const finalAmount = adjustedAmount * (1 - discount);

                return finalAmount;
            } else {
                throw new Error(
                    "Customer does not exist or does not have active subscriptions.",
                );
            }
        } catch (error) {
            console.error("Error applying coupon:", error);
            throw error;
        }
    }

    async getCoupons() {
        try {
            const coupons = await this.stripe.coupons.list();
            return {
                message: "Coupons fetched successfully",
                statusCode: 200,
                data: coupons.data,
            };
        } catch (error) {
            throw new Error(`Failed to fetch coupons: ${error.message}`);
        }
    }

    async getCouponsById(couponId: string) {
        try {
            const coupon = await this.stripe.coupons.retrieve(couponId);
            return {
                message: "Coupon fetched successfully",
                statusCode: 200,
                data: coupon,
            };
        } catch (error) {
            throw new Error(`Failed to fetch coupon: ${error.message}`);
        }
    }
}
