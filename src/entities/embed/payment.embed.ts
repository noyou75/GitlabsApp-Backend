import { Exclude, Expose } from 'class-transformer';
import { Column, Index } from 'typeorm';

@Exclude()
export class PaymentEmbed {
  @Column({ nullable: true })
  @Index()
  @Expose()
  externalId: string; // Customer ID for Stripe

  @Column({ nullable: true })
  @Expose()
  cardBrand: string;

  @Column({ nullable: true })
  @Expose()
  last4: string;

  @Column({ nullable: true })
  @Expose()
  cardholderName: string;

  @Column({ nullable: true })
  @Expose()
  expMonth: string;

  @Column({ nullable: true })
  @Expose()
  expYear: string;
}
