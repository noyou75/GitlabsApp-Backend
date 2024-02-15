import { utcToZonedTime } from 'date-fns-tz';
import Stripe from "stripe";
import { AppointmentStatus } from '../../../../common/enums/appointment-status.enum';
import { DiscountType } from '../../../../common/enums/discount-type.enum';
import { AppointmentEntity } from '../../../../entities/appointment.entity';
import { LabLocationEntity } from '../../../../entities/lab-location.entity';
import { LabOrderDetailsEntity } from '../../../../entities/lab-order-details.entity';
import { SpecialistUser } from '../../../../entities/user.entity';
import { BookingKey } from '../../../availability/dto/booking-key';
import { getPopulator, ReportColumn } from '../../../reporting/format/report-aggregator.service';
import { booleanToYesNo, formatDateTime } from '../../../reporting/util/report.util';
import { getActionTimestamp } from '../appointment-report.util';
import { differenceInYears, format } from 'date-fns';

const paymentIntentType = { isType: obj => obj?.object === 'payment_intent' };

const azTimezone = 'America/Phoenix';

export class AppointmentsByMonthAggregateFormat {
  @ReportColumn<Date, string>({
    header: 'Appointment Booking Date (PHX Time)',
    populator: getPopulator(AppointmentEntity, entity => entity.createdAt),
    export: val => formatDateTime(utcToZonedTime(val, azTimezone))
  })
  public bookingDate: Date;

  @ReportColumn<Date, string>({
    header: 'Appointment Date (PHX Time)',
    populator: getPopulator(AppointmentEntity, entity => entity.startAt),
    export: val => format(utcToZonedTime(val, azTimezone), 'yyyy-MM-dd')
  })
  public appointmentDate: Date;

  @ReportColumn<number>({
    header: 'Appointment Cost',
    populator: getPopulator(BookingKey, bookingKey => bookingKey.price / 100)
  })
  public appointmentCost: number;

  @ReportColumn<number>({
    header: 'Credits Applied',
    populator: getPopulator(paymentIntentType, (paymentIntent: Stripe.PaymentIntent) => {
      return paymentIntent?.metadata?.credits ? Number(paymentIntent.metadata.credits) / 100 : 0;
    })
  })
  public creditsApplied: number;

  @ReportColumn<string>({
    header: 'Promo Code Used',
    populator: getPopulator(AppointmentEntity, appointment => appointment.coupon?.code)
  })
  public promoCode: string;

  @ReportColumn<string>({
    header: 'Promo Code Value',
    populator: getPopulator(AppointmentEntity, appointment => {
        if (!appointment.coupon) {
          return null;
        }

        return appointment.coupon.discountType === DiscountType.Percentage ? `${ appointment.coupon.discount }%` :
          `$${ appointment.coupon.discount / 100 }`;
      })
  })
  public promoValue: string;

  @ReportColumn<string>({
    header: 'ZIP Code',
    populator: getPopulator(AppointmentEntity, appointment => appointment.patient.address.zipCode)
  })
  public zipCode: string;

  @ReportColumn<Date, string>({
    header: 'Appointment Start Time (UTC)',
    populator: getPopulator(AppointmentEntity, appointment => appointment.startAt),
    export: formatDateTime
  })
  public startAt: Date;

  @ReportColumn<string>({
    header: 'Appointment ID',
    populator: getPopulator(AppointmentEntity, appointment => appointment.identifier)

  })
  public identifier: string;

  @ReportColumn<string>({
    header: 'Appointment Status',
    populator: getPopulator(AppointmentEntity, appointment => appointment.status)
  })
  public status: string;

  @ReportColumn<string>({
    header: 'Appointment Cancellation Reason',
    populator: getPopulator(AppointmentEntity, appointment => appointment.cancelReason ?
      `${ appointment.cancelReason }${ appointment.cancelNote ? `: ${ appointment.cancelNote }` : '' }` : '')
  })
  public cancelReason: string;

  @ReportColumn<boolean, string>({
    header: 'Payment Refunded',
    populator: getPopulator(paymentIntentType, (paymentIntent: Stripe.PaymentIntent) => {
        return paymentIntent.charges.data.reduce((collector, charge) => {
          return collector + charge.amount - charge.amount_refunded;
        }, 0) < paymentIntent.amount;
      }),
    export: booleanToYesNo,
  })
  public refunded: boolean;

  @ReportColumn<number>({
    header: 'Refund Amount',
    populator: getPopulator(paymentIntentType,
      (paymentIntent: Stripe.PaymentIntent) => {
        const refunded = paymentIntent.amount - paymentIntent.charges.data.reduce((collector, charge) => {
          return collector + charge.amount - charge.amount_refunded;
        }, 0);

        /* If the outstanding amount is 50 cents or less, we will be rendering it as 0, since we don't bother processing
         * payments of this amount. */
        return refunded > 50 ? (refunded / 100) : 0;
      })
  })
  public refundAmount: number;

  @ReportColumn<Date, string>({
    header: 'Cancel Timestamp (UTC)',
    populator: getPopulator(AppointmentEntity, appointment => getActionTimestamp(appointment, AppointmentStatus.Cancelled)),
    export: formatDateTime,
  })
  public cancelTime: Date;

  @ReportColumn<string>({
    header: 'Patient Gender',
    populator: getPopulator(AppointmentEntity, appointment => appointment.patient.gender)
  })
  public patientGender: string;

  @ReportColumn<number>({
    header: 'Patient Age',
    populator: getPopulator(AppointmentEntity, appointment => differenceInYears(new Date(), appointment.patient.dob))
  })
  public patientAge: number;

  @ReportColumn<boolean, string>({
    header: 'Medicare Indicator',
    populator: getPopulator(AppointmentEntity, appointment => appointment.isMedicare),
    export: booleanToYesNo,
  })
  public medicareIndicator: boolean;

  @ReportColumn<LabLocationEntity, string>({
    header: 'Destination Laboratory',
    populator: getPopulator(AppointmentEntity, appointment => appointment.labLocation),
    export: labLocation => labLocation ? `${ labLocation.lab } at ${ labLocation.address.composed }` : ''
  })
  public destinationLab: LabLocationEntity;

  @ReportColumn<LabOrderDetailsEntity[], string>({
    header: 'Has Lab Order Indicator',
    populator: getPopulator(AppointmentEntity, appointment => appointment.labOrderDetails),
    export: labOrderDetailsCollection => labOrderDetailsCollection.length === 1 ? booleanToYesNo(labOrderDetailsCollection[0].hasLabOrder) :
      labOrderDetailsCollection.reduce((collector, labOrderDetails, idx) => {
        return ((collector && `${ collector }, `) || '') + `Lab Order ${ idx + 1 }: ${ booleanToYesNo(labOrderDetails.hasLabOrder) }`
      }, '')
  })
  public hasLabOrder: LabOrderDetailsEntity[];

  @ReportColumn<SpecialistUser, string>({
    header: 'Specialist',
    populator: getPopulator(AppointmentEntity, appointment => appointment.specialist),
    export: specialist => specialist?.name || ''
  })
  public specialist: SpecialistUser;

  @ReportColumn<Date, string>({
    header: 'En Route Timestamp (UTC)',
    populator: getPopulator(AppointmentEntity, appointment => getActionTimestamp(appointment, AppointmentStatus.EnRoute)),
    export: formatDateTime
  })
  public enRouteTime: Date;

  @ReportColumn<Date, string>({
    header: 'In Progress Timestamp (UTC)',
    populator:
      getPopulator(AppointmentEntity, appointment => getActionTimestamp(appointment, AppointmentStatus.InProgress)),
    export: formatDateTime
  })
  public inProgressTime: Date;

  @ReportColumn<Date, string>({
    header: 'Collection Timestamp (UTC)',
    populator: getPopulator(AppointmentEntity, appointment => getActionTimestamp(appointment, AppointmentStatus.Collected)),
    export: formatDateTime
  })
  public collectionTime: Date;
}
