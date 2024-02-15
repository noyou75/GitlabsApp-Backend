import { Exclude, Expose } from 'class-transformer';
import Stripe from 'stripe';

@Exclude()
export class PaymentDto {
  constructor(data: Stripe.PaymentIntent) {
    this.id = data.id;
    this.status = data.status;
    this.amount = data.amount;

    const charge = data.charges.data.find((c) => c.paid === true);

    if (charge) {
      this.amountRefunded = charge.amount_refunded;
      this.currency = charge.currency;
      this.createdAt = new Date(charge.created * 1000);
      this.paid = charge.paid;
      this.refunded = charge.refunded;
      this.refundedAt = charge.refunded ? new Date(charge.refunds.data[0].created * 1000) : undefined;
      this.card = {
        brand: charge.payment_method_details['card'].brand,
        last4: charge.payment_method_details['card'].last4,
      };
    }
  }

  @Expose()
  id: string;

  @Expose()
  status: string;

  @Expose()
  amount: number;

  @Expose()
  amountRefunded: number;

  @Expose()
  currency: string;

  @Expose()
  createdAt: Date;

  @Expose()
  paid: boolean;

  @Expose()
  refunded: boolean;

  @Expose()
  refundedAt: Date;

  @Expose()
  card: {
    brand: string;
    last4: string;
  };
}
