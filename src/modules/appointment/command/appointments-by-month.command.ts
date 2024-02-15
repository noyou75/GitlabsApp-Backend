import { Injectable } from '@nestjs/common';
import { endOfMonth, format, formatISO, parse, startOfMonth, subMonths } from 'date-fns';
import { Between, getRepository, IsNull } from 'typeorm';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { Command, Optional } from '../../command/command.decorator';
import { GCPConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { StorageService } from '../../core/services/storage.service';
import { StripeService } from '../../core/services/stripe.service';
import { ReportAggregatorService } from '../../reporting/format/report-aggregator.service';
import { CsvFileService, CsvStream } from '../../reporting/services/csv-file.service';
import { AppointmentService } from '../appointment.service';
import { AppointmentsByMonthAggregateFormat } from '../reporting/appointments-by-month/appointments-by-month-aggregate.format';

@Injectable()
export class AppointmentsByMonthCommand {

  constructor(
    private readonly csvFileService: CsvFileService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly reportAggregatorService: ReportAggregatorService,
    private readonly storageService: StorageService,
    private readonly appointmentService: AppointmentService,
    private readonly loggerService: LoggerService,
  ) { }

  @Command({
    command: 'report:appointments-by-month',
    describe: `Generate a report detailing the months' appointments`,
  })
  async run(
    @Optional({
      name: 'date',
      desc: 'The month for which to generate the report for in the format of yyyy-MM (ie. 2020-08). Defaults to the previous month.',
      coerce: (arg: string) => parse(arg, 'yyyy-MM', new Date()),
    })
      date: Date = subMonths(new Date(), 1),
  ) {
    this.loggerService.info(`Starting the monthly appointment report generation process...`);

    /* 0. Create an aggregator for the appointments by month report format. */
    const aggregator = this.reportAggregatorService.createReportAggregator(AppointmentsByMonthAggregateFormat);

    /* 1. Retrieve all of the relevant data... */

    /* Get all appointments in the specified month. */
    this.loggerService.info(`Retrieving appointments for the month of ${ format(date, 'yyyy-MM') }...`);
    const appointments = await getRepository(AppointmentEntity).find({
      where: {
        startAt: Between(startOfMonth(date), endOfMonth(date)),
        rebookedTo: IsNull(),
      }
    });
    this.loggerService.info(`${ appointments.length } appointments retrieved.`);

    /* 2. Configure a CSV file as the target of the collected rows. */
    this.loggerService.info(`Provisioning output stream for report...`);
    let parser: CsvStream;
    let bucket: string;
    let filename: string;

    try {
      bucket = this.configService.get(GCPConfig.PrivateBucket);
      filename = `reports/monthly-appointments/monthly-appointments-${ format(date, 'yyyy-MM') }-${ formatISO(new Date()) }.csv`;
      parser = this.csvFileService.getCsvFormatter(AppointmentsByMonthAggregateFormat, this.storageService.write(bucket, filename))
    } catch(err) {
      throw new Error(`Could not open CSV stream due to embedded exception: ${ err }`);
    }

    this.loggerService.info(`Output stream provisioned.`);
    this.loggerService.info(`Retrieving payment intent and booking key for each appointment...`);

    /* For each appointment row, resolve the payment intent data/booking key, and create a report row. */
    for (const appointment of appointments) {
      try {
        this.loggerService.debug(`Retrieving payment intent for ${ appointment.id }...`);
        const paymentIntent$ = this.stripeService.retrievePaymentIntent(appointment.paymentIntentId);

        /* While we are waiting for the payment intent, sort the appointment's statuses in order from
         * newest entry to oldest entry. */
        appointment.statusHistory.sort((statusEntryA, statusEntryB) => {
          return statusEntryA.createdAt < statusEntryB.createdAt ? 1 : -1;
        });

        const paymentIntent = await paymentIntent$;
        this.loggerService.debug(`Payment intent retrieved.`);

        this.loggerService.debug(`Retrieving booking key for ${ appointment.id }...`);
        const bookingKey = paymentIntent?.metadata?.bookingKey && await this.appointmentService.readBookingKey(paymentIntent.metadata.bookingKey);
        this.loggerService.debug(`Booking key retrieved.`);

        this.loggerService.debug(`Populating row data for ${ appointment.id }...`);
        const row = aggregator.populate(appointment, paymentIntent, bookingKey);

        /* Output the row to the resulting report. */
        parser.inputStream.push(row);
        this.loggerService.debug(`Row data populated.`);
      } catch (err) {
        this.loggerService.error(`Unable to populate data for appointment ${ appointment.id } due to embedded exception: :${ err }`);
      }
    }

    /* Push null into the input stream to indicate that we have completed processing... */
    parser.inputStream.push(null);

    this.loggerService.info(`Appointment data recorded; waiting for stream to close...`);

    /* Wait for the file output stream to complete. */
    await parser.getComplete$();

    this.loggerService.info(`Appointment report generation process complete.  Report is available at ` +
      `${ bucket }/${ filename }`);
  }
}
