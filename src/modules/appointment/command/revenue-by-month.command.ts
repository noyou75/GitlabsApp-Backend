import { Injectable } from '@nestjs/common';
import { endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns';
import { reduce } from 'p-iteration';
import Stripe from 'stripe';
import { Between, IsNull } from 'typeorm';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { Command, Optional } from '../../command/command.decorator';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { StripeService } from '../../core/services/stripe.service';
import { AppointmentService } from '../appointment.service';

@Injectable()
export class RevenueByMonthCommand {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly appointmentService: AppointmentService,
    private readonly stripe: StripeService,
  ) {}

  @Command({
    command: 'report:revenue-by-month',
    describe: 'Report the revenue figures for the given month',
  })
  async run(
    @Optional({
      name: 'date',
      desc: 'The month for which to generate the report for in the format of yyyy-MM (ie. 2020-08). Defaults to the previous month.',
      coerce: (arg: string) => parse(arg, 'yyyy-MM', new Date()),
    })
    date: Date = subMonths(new Date(), 1),
  ) {
    this.logger.log(`Generating revenue report... month=${format(date, 'yyyy-MM')}`);

    const appointments = await this.getAppointmentsForMonth(date);

    this.logger.log(`Total Appointments: ${appointments.total}`);

    // Use a Set to quickly filter out duplicates
    const paymentIntentIds = [...new Set(appointments.data.map((a) => a.paymentIntentId))];

    this.logger.log(`Unique Payments: ${paymentIntentIds.length}`);

    const charges: Stripe.Charge[] = [];

    for (const piId of paymentIntentIds) {
      this.logger.log(`Retrieving payment information for ${piId}...`);
      charges.push(...(await this.stripe.retrievePaymentIntent(piId)).charges.data);
    }
    const revenue = charges.reduce((total, charge) => {
      return total + charge.amount - charge.amount_refunded;
    }, 0);

    const discounts = await reduce(
      charges,
      async (total, charge) => {
        // Ignore refunded charges
        if (charge.refunded) {
          return total;
        }

        if (!charge.metadata.bookingKey) {
          // Shouldn't happen as we always should be sending the booking key... but guard against it nonetheless
          this.logger.warn(`Missing booking key for charge=${charge.id}, payment_intent=${charge.payment_intent}`);
          return total;
        }

        try {
          const original = (await this.appointmentService.readBookingKey(charge.metadata.bookingKey)).price;
          return total + (original - charge.amount);
        } catch (e) {
          this.logger.warn(`Unable to decrypt booking key! key=${charge.metadata.bookingKey}`);
          return 0;
        }
      },
      0,
    );

    const nonCancelledAppointments = appointments.data.filter((a) => a.status !== AppointmentStatus.Cancelled);

    this.logger.log(`Total Appointments: ${nonCancelledAppointments.length}`);
    this.logger.log(`Unique Payments: ${paymentIntentIds.length}`);
    this.logger.log(`Total Revenue: $${(revenue / 100).toFixed(2)}`);
    this.logger.log(`Total Discounts: $${(discounts / 100).toFixed(2)}`);
    this.logger.log(`Average Revenue Per Appointment: $${(revenue / nonCancelledAppointments.length / 100).toFixed(2)}`);
  }

  private getAppointmentsForMonth(date: Date) {
    return this.appointmentService.find((opts) => {
      opts.where = {
        startAt: Between(startOfMonth(date), endOfMonth(date)),
        rebookedTo: IsNull(),
      };
    });
  }

  // build trigger
}
