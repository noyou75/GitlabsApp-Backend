import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { plainToClass } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { differenceInYears } from 'date-fns';
import Stripe from 'stripe';
import { DeepPartial, FindConditions, getRepository, Raw } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { FilePurpose } from '../../common/enums/file-purpose.enum';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { FileEntity } from '../../entities/file.entity';
import { LabOrderDetailsEntity } from '../../entities/lab-order-details.entity';
import { PatientUser, SpecialistUser, User } from '../../entities/user.entity';
import { AnalyticsManager } from '../analytics/decorators/use-analytics.decorator';
import { AbstractEntityAnalyticsManager } from '../analytics/types/abstract-entity-analytics.manager';
import { CrudService } from '../api/crud/crud.service';
import { AuthService } from '../auth/auth.service';
import { BookingKey } from '../availability/dto/booking-key';
import { AppointmentConfig } from '../core/enums/config.enum';
import { BrowserService } from '../core/services/browser.service';
import { ConfigService } from '../core/services/config.service';
import { LoggerService } from '../core/services/logger.service';
import { StripeService } from '../core/services/stripe.service';
import { CouponService } from '../coupon/coupon.service';
import { CouponMetadata } from '../coupon/metadata/coupon.metadata';
import { isCreditEligible } from '../credit/services/credit-eligible.decorator';
import { FileProcessorStatusDto } from '../file-processor/dto/file-processor-status.dto';
import { FileProcessorJobService } from '../file-processor/services/file-processor-job.service';
import { FileService } from '../file/file.service';
import { LabOrderDetailsService } from '../lab-order-details/lab-order-details.service';
import { LabLocationService } from '../locale/lab-location/lab-location.service';
import { ServiceAreaService } from '../locale/service-area/service-area.service';
import { NotificationService } from '../notification/services/notification.service';
import { PatientCreditService } from '../patient-credit/patient-credit.service';
import { StringEncoderService } from '../shared/services/string-encoder.service';
import { TemplatingService } from '../templating/services/templating.service';
import { LabDropOffFormTemplate } from '../templating/templates/lab-drop-off-form.template';
import { PatientUserService } from '../user/patient/patient-user.service';
import {
  AppointmentCancelledAnalyticsEvent,
  AppointmentCreatedAnalyticsEvent,
  AppointmentRebookedAnalyticsEvent,
  AppointmentUpdatedAnalyticsEvent,
} from './appointment-analytics.event';
import { AppointmentFromKeyDto } from './dto/appointment-from-key.dto';
import { ValidateStatus } from './dto/appointment-status-validator.dto';
import { BookingKeyDto } from './dto/booking-key.dto';
import { PaymentAdjustment, PaymentAdjustmentDto, PaymentAdjustmentType } from './dto/payment-adjustment.dto';
import { AppointmentRefundedNotification } from './notifications/appointment-refunded.notification';
import { AppointmentJobService } from './service/appointment-job.service';

/**
 * AppointmentEntityAnalyticsManager handles the dispatch of analytics events describing the appointment lifecycle.
 */
@AnalyticsManager(AppointmentEntity)
export class AppointmentEntityAnalyticsManager extends AbstractEntityAnalyticsManager<AppointmentEntity> {
  trackCreate(entity: AppointmentEntity): void {
    super.track(new AppointmentCreatedAnalyticsEvent(entity, this.getRequestContextUser()));
  }

  trackUpdate(entity: AppointmentEntity, changes: string[], old: AppointmentEntity): void {
    let event;

    /* The event we choose will be determined by which fields are present in the changes set. */
    if (changes.includes('rebookedTo')) {
      /* Rebooked to field changed - that means that the appointment was rescheduled. */
      event = new AppointmentRebookedAnalyticsEvent(entity, this.getRequestContextUser());
    } else if (changes.includes('status') && entity.status === AppointmentStatus.Cancelled && old.status !== AppointmentStatus.Cancelled) {
      /* Cancel reason changed - that means the appointment was cancelled. */
      event = new AppointmentCancelledAnalyticsEvent(entity, this.getRequestContextUser());
    } else {
      /* Otherwise, note that the appointment has been updated. */
      event = new AppointmentUpdatedAnalyticsEvent(entity, changes, this.getRequestContextUser());
    }

    super.track(event);
  }

  trackDelete(entity: AppointmentEntity): void {
    super.track(new AppointmentCancelledAnalyticsEvent(entity));
  }
}

@Injectable()
export class AppointmentService extends CrudService(AppointmentEntity) implements OnModuleInit {
  @Inject()
  private readonly queryBus: QueryBus;

  @Inject()
  private readonly encoder: StringEncoderService;

  @Inject()
  private readonly config: ConfigService;

  @Inject()
  private readonly serviceArea: ServiceAreaService;

  @Inject()
  private readonly stripe: StripeService;

  @Inject()
  private readonly patients: PatientUserService;

  @Inject()
  private readonly browserService: BrowserService;

  @Inject()
  private readonly templating: TemplatingService;

  @Inject()
  private readonly auth: AuthService;

  @Inject()
  private readonly coupons: CouponService;

  @Inject()
  private readonly logger: LoggerService;

  @Inject()
  private readonly notifications: NotificationService;

  @Inject()
  private readonly appointmentJobs: AppointmentJobService;

  @Inject()
  private readonly labOrderDetailsService: LabOrderDetailsService;

  @Inject()
  private readonly labLocationService: LabLocationService;

  @Inject()
  private readonly fileService: FileService;

  @Inject()
  private readonly patientCreditService: PatientCreditService;

  @Inject()
  private readonly fileProcessor: FileProcessorJobService;

  timeslotDuration: number;

  onModuleInit() {
    this.timeslotDuration = this.config.get(AppointmentConfig.TimeslotDuration) || 3600;
  }

  async isServiceable(user: PatientUser): Promise<boolean> {
    if (!user.address || !user.address.zipCode) {
      return false;
    }
    return await this.serviceArea.isActive(user.address.zipCode);
  }

  async createPaymentIntent(
    user: PatientUser,
    amount: number,
    useCredits = false,
    metadata?: Stripe.MetadataParam,
  ): Promise<PaymentAdjustmentDto> {
    // Make sure there is a stripe customer to which to attach this payment intent
    if (!user.paymentProfile.externalId) {
      const { id } = await this.stripe.createCustomer(user);
      user.paymentProfile.externalId = id;
      await this.patients.update(user);
    }

    const credits = useCredits && isCreditEligible(AppointmentEntity) ? Math.min(amount, this.patientCreditService.getBalance(user)) : 0;

    /* If the consumer has indicated to use credits, we will attempt to apply credits to this appointment's payment intent */
    if (credits) {
      /* Subtract the available credits from the cost of the appointment, and update the metadata object to include the applied credits. */
      amount = this.sanitizeAmount(amount - credits);
      metadata = { ...metadata, credits };
    }

    const paymentIntent = await this.stripe.createPaymentIntent(user, amount, metadata);

    /* Assemble a descriptive object that includes the payment intent, as well as a breakdown of all adjustments applied. */
    return plainToClass(PaymentAdjustmentDto, {
      paymentIntent,
      adjustments: await this.getAdjustments(paymentIntent),
    });
  }

  async applyCoupon(paymentIntentId: string, coupon: string): Promise<PaymentAdjustmentDto> {
    // Retrieve original payment intent to find original price from the booking key
    const { paymentIntent, bookingKey, user } = await this.resolveAppointmentDetails(paymentIntentId);

    let updatedPaymentIntent = paymentIntent;

    if (await this.coupons.isEligible(user, coupon)) {
      /* Calculate the discounted amount for the new payment intent.  If credits were applied to the initial payment intent, they must
       * be applied here as well.  However, they must be applied *after* the coupon price is calculated. */
      const amount = await this.coupons.getDiscountedPrice(bookingKey.price, coupon);
      const couponMetadata: CouponMetadata = {
        amount: bookingKey.price - amount,
        coupon,
      };

      /* If the coupon-applied amount is less than the amount of credits we intended to apply, then we will need to reduce the
       * applied credits amount by the difference between the original amount and the coupon-applied amount. */
      const credits: number = Math.min(
        (typeof paymentIntent.metadata.credits === 'string'
          ? parseInt(paymentIntent.metadata.credits, 10)
          : paymentIntent.metadata.credits) || 0,
        amount,
      );

      updatedPaymentIntent = await this.stripe.updatePaymentIntent(paymentIntent.id, {
        amount: this.sanitizeAmount(amount - credits), // Amount must be greater than $0.50 USD or this will fail
        metadata: {
          coupon: JSON.stringify(couponMetadata),
          credits,
        },
      });
    }

    return plainToClass(PaymentAdjustmentDto, {
      paymentIntent: updatedPaymentIntent,
      adjustments: await this.getAdjustments(updatedPaymentIntent),
    });
  }

  async removeCoupon(paymentIntentOrId: string | Stripe.PaymentIntent): Promise<PaymentAdjustmentDto> {
    // Retrieve original payment intent to find original price from the booking key
    const { paymentIntent, bookingKey, user } = await this.resolveAppointmentDetails(paymentIntentOrId);

    const amount = bookingKey ? bookingKey.price : this.config.get(AppointmentConfig.BasePrice);

    /* Re-apply outstanding credits, if they are available. */
    const credits = Math.min(this.patientCreditService.getBalance(user), amount);

    const updatedPaymentIntent = await this.stripe.updatePaymentIntent(paymentIntent.id, {
      amount: this.sanitizeAmount(amount - credits),
      metadata: {
        coupon: null,
        credits,
      },
    });

    return plainToClass(PaymentAdjustmentDto, {
      paymentIntent: updatedPaymentIntent,
      adjustments: await this.getAdjustments(updatedPaymentIntent),
    });
  }

  async refund(appointment: AppointmentEntity, reason?: string, notify = false) {
    if (!appointment.paymentIntentId) {
      throw Error('Unable to refund appointment! No payment intent found.');
    }

    /* Resolve the payment intent attached to this appointment.  If credits were used to pay for this appointment, refund those.
     * We will also need ot refund the payment intent, if necessary. */
    const r = await Promise.all([
      this.stripe
        .retrievePaymentIntent(appointment.paymentIntentId)
        .then((pi) => {
          /* If the payment intent included credits, refund those now. */
          const credits = (typeof pi.metadata.credits === 'string' ? parseInt(pi.metadata.credits, 10) : pi.metadata.credits) || 0;

          return credits && this.patientCreditService.refundCredit(appointment.patient, credits, appointment);
        })
        .catch((err) => {
          /* An exception must not prevent the payment intent from being refunded. */
          this.logger.error(
            `Unable to refund credits for appointment ${appointment.id} due to an exception thrown by the ` +
            `credit refund operation: ${JSON.stringify(err)}`,
          );
        }),
      this.stripe.refundPaymentIntent(appointment.paymentIntentId, reason),
    ]).then((results) => {
      /* Ensure the results of the refund payment intent operation are respected as the ultimate return val */
      return results[1];
    });

    notify && (await this.notifications.send(AppointmentRefundedNotification, appointment.patient, {}));

    return r;
  }

  async createFromKey(
    data: AppointmentFromKeyDto,
    user: PatientUser,
    init?: Partial<AppointmentEntity>,
    track = true,
  ): Promise<AppointmentEntity> {
    /* If this user is not serviceable, throw an error indicating that this is not permitted. */
    if (!(await this.isServiceable(user))) {
      throw new Error(`Cannot schedule appointment! The supplied user is not serviceable!  userId=${user.id}`);
    }

    /* If the 'init' object is not supplied, we are dealing with a new appointment booking, which comes with an associated cost and
     * a potential application of credits.  Retrieve the payment intent to determine if credits should be deducted from the patient's
     * account as a result of this booking. */
    const credits$ =
      !init &&
      data.paymentIntentId &&
      this.stripe.retrievePaymentIntent(data.paymentIntentId).then((pi) => {
        return (typeof pi.metadata.credits === 'string' ? parseInt(pi.metadata.credits, 10) : pi.metadata.credits) || 0;
      });

    const key = await this.readBookingKey(data.key);

    const appointment = new AppointmentEntity();

    Object.assign(appointment, init);

    appointment.patient = user;

    // Specialist is undefined in V2
    // TODO: Remove assigning to a specialist in creation
    appointment.specialist = key.specialist ? await getRepository(SpecialistUser).findOneOrFail(key.specialist) : undefined;

    appointment.status = init?.status ?? AppointmentStatus.Pending;
    appointment.labOrderDetails = await this.processLabOrders(data);
    appointment.startAt = key.startAt;
    appointment.endAt = key.endAt;
    appointment.paymentIntentId = data.paymentIntentId;

    /* If this user is 65+, we will automatically mark them as a medicare patient. */
    appointment.isMedicare = differenceInYears(new Date(), user.dob) >= 65;

    try {
      appointment.coupon = data.coupon ? await this.coupons.getCoupon(data.coupon) : undefined;
    } catch (e) {
      if (!(e instanceof EntityNotFoundError)) {
        throw e;
      }
    }

    /* Create the appointment and unwrap our credits promise. */
    const [result, credits] = await Promise.all([this.create(appointment, track), credits$]);

    /* If we have credits to redeem, let's redeem those now. */
    credits && (await this.patientCreditService.applyCredit(user, credits, result));

    return result;
  }

  async rebookFromKey(appointment: AppointmentEntity, data: BookingKeyDto): Promise<AppointmentEntity> {
    const key = await this.readBookingKey(data.key);

    return await this.update(appointment, {
      specialist: key.specialist ? await getRepository(SpecialistUser).findOneOrFail(key.specialist) : undefined,
      startAt: key.startAt,
      endAt: key.endAt,
    });
  }

  async readBookingKey(data: string): Promise<BookingKey> {
    const key = plainToClass(BookingKey, JSON.parse(this.encoder.decrypt(data)));

    const errors = await this.validate(key, true);

    if (errors.length > 0) {
      throw new Error('Invalid booking key! ');
    }

    return key;
  }

  async generateDeliveryFormPdf(appointment: AppointmentEntity): Promise<Buffer> {
    const start1 = new Date();
    const isAddressLab = await this.labLocationService.isAddressLab(appointment.patient.address);
    const render = await this.templating.render(LabDropOffFormTemplate, { appointment, isAddressLab });

    const end1 = (new Date() as any) - (start1 as any);
    console.info('Render time: %dms', end1);

    const start2 = new Date();
    const pdf = await this.browserService.htmlToPdf(render);

    const end2 = (new Date() as any) - (start2 as any);
    console.info('HTML to PDF time: %dms', end2);

    return pdf;
  }

  async sendContinueOnMobileLink(user: User): Promise<void> {
    await this.auth.sendKey(await this.auth.generateKey(user, '/book/step-3/upload'), user);
  }

  async update(entity: AppointmentEntity, changes?: DeepPartial<AppointmentEntity>): Promise<AppointmentEntity> {
    /* If the change set includes new lab order details entity (i.e. no id/no ordinal), we will need to assign an ordinal to
     * these objects corresponding to its position in the supplied entity details collection. */
    changes.labOrderDetails?.forEach((val, index) => (val.ordinal = val.ordinal || index));

    /* Update the entity by doing a traditional deep merge */
    let results = await super.update(entity, changes);

    /* If the supplied change set includes files that have been marked for deletion, we will need to update the assoc table directly (as
     * typeorm doesn't seem to have any sensible way of filtering out soft-deleted relational array elements). */
    /* This logic is placed here for now - however, it would likely be better served in a BaseSubscriber class on all entity updates
     * as this type of change would have very far-reaching consequences, and we just don't have the time to test those. */
    const deleted$ = changes?.labOrderDetails?.reduce((deleteOpCollector, lodPartial) => {
      deleteOpCollector.push(
        this.labOrderDetailsService.read(lodPartial.id).then((lodModel) => {
          return this.fileService.clearFiles(LabOrderDetailsEntity, lodPartial, lodModel);
        }),
      );

      return deleteOpCollector;
    }, new Array<Promise<any>>());

    if (deleted$ && deleted$.length) {
      results = await Promise.all(deleted$).then(() => this.read(entity.id));
    }

    /* Return the updated entity */
    return results;
  }

  /**
   * Validates that the appointment is in one of the provided statuses.
   */
  async validateAppointmentStatus(
    appointment: AppointmentEntity,
    statuses: AppointmentStatus | AppointmentStatus[],
    suppressException?: boolean,
  ): Promise<ValidationError[]> {
    return await this.validate(new (class extends ValidateStatus(appointment, statuses) { })(), suppressException);
  }

  /**
   * Sets a deferred task for reminding patients to complete their booking - should be cancelled by other logic
   * in the event the patient does complete the booking.
   */
  public async setBookingReminder(user: PatientUser) {
    /* Safeguard - we only want to dispatch this reminder notification if the user is serviceable. */
    (await this.isServiceable(user)) && (await this.appointmentJobs.setIncompleteBookingReminder(user));
  }

  public async hasPreviousAppointments(user: PatientUser) {
    return !!(await this.getRepository().count({
      where: {
        patient: user.id,
      },
    }));
  }

  /**
   * Finds all original appointment bookings.  The result of this operation will return all appointment bookings for a given user, but
   * will exclude any appointment rows that represent an appointment rebooked FROM another appointment (i.e. in an appointment rebooking
   * chain, only the original appointment booking will be returned).
   */
  public async findOriginalAppointments(user: PatientUser, where: FindConditions<AppointmentEntity> = {}) {
    return this.find((opts) => {
      opts.where = {
        ...where,

        /* We do NOT want any rows where the id appears in another row's rebookedTo column. */
        id: Raw((alias) => {
          return `(SELECT
                    COUNT(*)
                  FROM
                    app_appointment a
                  WHERE
                    a.rebooked_to_id = ${alias})
                  = 0`;
        }),
        patient: { id: user.id },
      };
      opts.relations = ['rebookedTo'];
      opts.order = {
        createdAt: 'ASC',
      };
    });
  }

  private async getAdjustments(paymentIntent: Stripe.PaymentIntent): Promise<PaymentAdjustment<any>[]> {
    /* Read the payment intent's metadata to parse out all recorded adjustments. */
    const adjustments: PaymentAdjustment<any>[] = [];

    /* Coupons are logically applied first */
    const couponMetadata: CouponMetadata = paymentIntent.metadata.coupon && JSON.parse(paymentIntent.metadata.coupon);

    couponMetadata &&
      couponMetadata.amount &&
      adjustments.push({
        amount: couponMetadata.amount,
        type: PaymentAdjustmentType.COUPON,
        data: {
          coupon: await this.coupons.getCoupon(couponMetadata.coupon),
        },
      });

    /* Then we check credits */
    const credits =
      (typeof paymentIntent.metadata.credits === 'string'
        ? parseInt(paymentIntent.metadata.credits, 10)
        : paymentIntent.metadata.credits) || 0;

    credits &&
      adjustments.push({
        amount: credits,
        type: PaymentAdjustmentType.CREDITS,
      });

    return adjustments;
  }

  private async resolveAppointmentDetails(paymentIntentOrId: string | Stripe.PaymentIntent) {
    /* Resolve the payment intent from the supplied paymentIntentId */
    const pi =
      typeof paymentIntentOrId === 'string'
        ? await this.stripe.retrievePaymentIntent(paymentIntentOrId, { expand: ['customer'] })
        : paymentIntentOrId;

    /* Resolve the booking key and user from the payment intent details; perform resolution in parallel for a faster response
     * time. */
    return Promise.all([
      this.readBookingKey(pi.metadata.bookingKey),
      this.patients.getRepository().findOneOrFail({
        paymentProfile: {
          externalId: typeof pi.customer === 'string' ? pi.customer : (pi.customer as Stripe.Customer).id,
        },
      }),
    ]).then((resolvedData) => {
      return {
        paymentIntent: pi,
        bookingKey: resolvedData[0],
        user: resolvedData[1],
      };
    });
  }

  /**
   * Minimum transaction amount on stripe must be 50 cents
   */
  private sanitizeAmount(amount: number) {
    return amount < 50 ? 50 : amount;
  }

  public async generateFile(appointment: AppointmentEntity, filePurpose: FilePurpose): Promise<FileProcessorStatusDto> {
    switch (filePurpose) {
      case FilePurpose.AppointmentDeliveryForm:
        await this.fileProcessor.generateAppointmentDeliveryForm(appointment.id);
        appointment.deliveryForm = null;
        await getRepository(AppointmentEntity).save(appointment);
        return {
          id: appointment.id,
          generating: true,
          file: null,
        };
    }
    return null;
  }

  /**
   * Processes the lab order information details contained in the supplied raw request object.  If the
   * request object includes a file reference, this method will load said file for the resulting
   * LaborderDetailsEmbed instance.
   */
  private async processLabOrders(data: AppointmentFromKeyDto) {
    return await Promise.all(
      data.labOrderDetails.map((rawLabOrderDetails) => {
        const labOrderDetails = plainToClass(LabOrderDetailsEntity, { ...rawLabOrderDetails }, { excludeExtraneousValues: true });

        return Promise.all([
          /* Each lab order details section could contain multiple files. */
          getRepository(FileEntity).findByIds(rawLabOrderDetails.labOrderIds),
          getRepository(FileEntity).findOne({ id: rawLabOrderDetails.accuDrawId }),
          getRepository(FileEntity).findOne({ id: rawLabOrderDetails.abnDocumentId }),
        ]).then((fileSet) => {
          labOrderDetails.labOrderFiles = fileSet[0];
          labOrderDetails.accuDraw = fileSet[1];
          labOrderDetails.abnDocument = fileSet[2];

          return labOrderDetails;
        });
      }),
    );
  }
}
