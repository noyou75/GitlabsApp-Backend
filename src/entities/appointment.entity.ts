import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsBoolean, IsDefined, IsIn, IsInstance, IsNotEmpty, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { differenceInMinutes, setHours, subDays } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import {
  Column,
  CreateDateColumn,
  DeepPartial,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { AppointmentCancellationReason } from '../common/enums/appointment-cancellation-reason.enum';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { CreditEligible } from '../modules/credit/services/credit-eligible.decorator';
import { MarketFilterable } from '../modules/market/decorator/market.decorator';
import { Product } from '../modules/product/product';
import { IsPaymentIntentStatus } from '../modules/shared/constraints/is-payment-intent-status.constraint';
import { Filterable } from '../modules/shared/decorators/filterable.decorator';
import { AppointmentSampleEntity } from './appointment-sample.entity';
import { CouponEntity } from './coupon.entity';
import { StatusHistoryEmbed } from './embed/status-history.embed';
import { FileEntity } from './file.entity';
import { LabLocationEntity } from './lab-location.entity';
import { LabOrderDetailsEntity, LabOrderSeedTypes } from './lab-order-details.entity';
import { PatientUser, SpecialistUser } from './user.entity';

// TODO: This entity is never created through the API directly, but rather the result of a booking key.
// TODO: Fix exposed properties that should be exposed.

@Entity({
  name: 'appointment',
})
@MarketFilterable({
  query: (qb, markets) => {
    qb.innerJoin(`${qb.alias}.patient`, 'p');
    qb.innerJoin('p.address.serviceArea', 'sa');
    qb.innerJoin('sa.market', 'm');
    qb.andWhere('m.id IN (:...markets)', { markets: (markets ?? []).map((market) => market.id) });
  },
})
@CreditEligible()
@Exclude()
export class AppointmentEntity implements Product {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @Column()
  @Index()
  @Expose({ toPlainOnly: true })
  identifier: string; // Mostly unique short code that identifies this appointment or related/rebooked appointments

  @ManyToOne(() => PatientUser, { eager: true, nullable: false })
  @Expose({ groups: [UserRole.Patient, UserRole.Specialist, UserRole.Staff] })
  patient: PatientUser; // TODO: Validate is existing

  @Filterable()
  @ManyToOne(() => SpecialistUser, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @Expose({ groups: [UserRole.Staff] })
  specialist: SpecialistUser; // TODO: Validate is existing

  @OneToOne(() => AppointmentEntity, { onDelete: 'SET NULL' })
  @JoinColumn()
  @Transform((val) => (val instanceof AppointmentEntity ? val.id : null))
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  rebookedFrom: AppointmentEntity;

  @OneToOne(() => AppointmentEntity, { onDelete: 'SET NULL' })
  @JoinColumn()
  @Transform((val) => (val instanceof AppointmentEntity ? val.id : null))
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  rebookedTo: AppointmentEntity;

  @ManyToOne(() => LabLocationEntity, { eager: true })
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  labLocation: LabLocationEntity;

  @OneToMany(() => AppointmentSampleEntity, (sample) => sample.appointment, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
    onDelete: 'CASCADE',
  })
  @Type(() => AppointmentSampleEntity)
  @ValidateIf((o: AppointmentEntity) => o.requiresSamples())
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  samples: AppointmentSampleEntity[];

  @Column({ default: false })
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  requiresFasting: boolean;

  @Column({ default: false })
  @Expose({ groups: [UserRole.Staff] })
  verifiedWithPatient: boolean;

  @Column({ default: false })
  @Expose({ groups: [UserRole.Staff] })
  verifiedWithSpecialist: boolean;

  @Filterable()
  @Column({ type: 'enum', enum: AppointmentStatus })
  @Expose()
  status: AppointmentStatus;

  @Column()
  @Expose({ toPlainOnly: true })
  statusDate: Date = new Date();

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (value) => plainToClass(StatusHistoryEmbed, value, { excludeExtraneousValues: true }),
      from: (value) => plainToClass(StatusHistoryEmbed, value),
    },
  })
  @Type(() => StatusHistoryEmbed)
  @Expose({ toPlainOnly: true })
  statusHistory: StatusHistoryEmbed[];

  @Column({ nullable: true, type: 'enum', enum: AppointmentCancellationReason })
  @ValidateIf((o: AppointmentEntity) => o.status === AppointmentStatus.Cancelled)
  @IsIn(enumValues(AppointmentCancellationReason))
  @Expose()
  cancelReason: AppointmentCancellationReason;

  @Column({ nullable: true })
  @ValidateIf((o: AppointmentEntity) => o.cancelReason === AppointmentCancellationReason.Other)
  @IsNotEmpty()
  @Expose()
  cancelNote: string;

  @Filterable()
  @OneToMany(() => LabOrderDetailsEntity, (labOrderDetails) => labOrderDetails.appointment, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
    onDelete: 'CASCADE',
  })
  @Transform(
    (labOrderDetailsEntities: DeepPartial<LabOrderDetailsEntity>[]) => {
      /* For reasons I do not understand, supplying 'relations' causes all one-to-many relations to be sorted by their last updated date.
       * Since we need to sort LabOrderDetailsEntity objects by their *ordinal*, we unfortunately must massage how they are queried on
       * the generic level.
       * See: https://github.com/typeorm/typeorm/issues/2620 */
      return labOrderDetailsEntities.sort((a, b) => (a.ordinal > b.ordinal ? 1 : -1));
    },
    {
      toPlainOnly: true,
    },
  )
  @Type(() => LabOrderDetailsEntity)
  @IsInstance(LabOrderDetailsEntity, { each: true })
  @ValidateNested()
  @Expose()
  labOrderDetails: LabOrderDetailsEntity[];

  @CreateDateColumn()
  @Expose({ toPlainOnly: true })
  createdAt: Date;

  @Column()
  @Expose({ toPlainOnly: true })
  startAt: Date;

  @Column()
  @Expose({ toPlainOnly: true })
  endAt: Date;

  @Column({ nullable: true })
  @ValidateIf((o: AppointmentEntity) => o.status === AppointmentStatus.Completed)
  @IsNotEmpty()
  @Expose()
  recipient: string;

  @ManyToOne(() => FileEntity, { eager: true, cascade: true, onDelete: 'SET NULL' })
  @ValidateIf((o: AppointmentEntity) => o.status === AppointmentStatus.Completed)
  @IsDefined()
  @Expose()
  signature: FileEntity;

  @ManyToOne(() => CouponEntity, { eager: true, cascade: true, onDelete: 'SET NULL' })
  @Expose()
  coupon?: CouponEntity;

  @Column({ nullable: true })
  @IsOptional()
  @IsBoolean()
  @Filterable()
  @Expose()
  isMedicare?: boolean;

  @Column()
  @IsOptional()
  @IsPaymentIntentStatus(['succeeded'])
  paymentIntentId?: string;

  @OneToOne(() => FileEntity, { eager: true, onDelete: 'SET NULL', cascade: true })
  @JoinColumn()
  @Type(() => FileEntity)
  @Expose()
  deliveryForm: FileEntity;

  requiresSamples(): boolean {
    if (Array.isArray(this.samples)) {
      return ![AppointmentStatus.Pending, AppointmentStatus.Cancelled].includes(this.status);
    }

    return false;
  }

  /**
   * Retrieves the cutoff date for the patient's doctor to remit the patient's lab order. This method is
   * only applicable in the doctor submit subworkflow; for all other lab provisioning subworkflows, this
   * method will return null.
   */
  getLabOrderDeadline(): Date {
    /* If the lab order type is 'doctor submit', determine the cutoff date as the day before the appointment, at noon in the patient's
     * local time zone. */
    if (!!this.labOrderDetails.find((lod) => lod.getLabOrderType() === LabOrderSeedTypes.DoctorSubmit)) {
      /* Retrieve the cutoff date in the patient's local timezone... */
      const cutoffDatePt = utcToZonedTime(subDays(this.startAt, 1), this.patient.timezone);

      /* Set to noon local time. */
      const cutoffDateTimePt = setHours(cutoffDatePt, 12);

      /* Return UTC time. */
      return zonedTimeToUtc(cutoffDateTimePt, this.patient.timezone);
    }

    /* If we get here, the cutoff date does not apply.  Return null. */
    return null;
  }

  @Expose({ toPlainOnly: true })
  isRefundable(): boolean {
    /* Refund period is 24 hours, minus a 15 minute grace period. */
    return differenceInMinutes(this.startAt, new Date()) > 60 * 24 - 15;
  }

  @Expose({ toPlainOnly: true })
  isRebookable(): boolean {
    return this.isRefundable() && [AppointmentStatus.Pending, AppointmentStatus.Confirmed].includes(this.status);
  }
}
