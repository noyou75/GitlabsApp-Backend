import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDate,
  IsEmail,
  IsIn,
  IsInstance,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  MinDate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { differenceInYears, format, isAfter, isBefore, isPast, parseISO, subDays } from 'date-fns';
import { castArray } from 'lodash';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { AccessLevel } from '../common/enums/access-level.enum';
import { DocumentType } from '../common/enums/document-type.enum';
import { SerializeDirectionEnum } from '../common/enums/serialize-direction.enum';
import {
  PatientDeactivationReason,
  SpecialistDeactivationReason,
  StaffDeactivationReason,
} from '../common/enums/user-deactivation-reason.enum';
import { UserGender } from '../common/enums/user-gender.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { numeric } from '../common/string.utils';
import { getValidatedCredits } from '../modules/credit/util/credit.util';
import { MarketFilterable } from '../modules/market/decorator/market.decorator';
import { IsExactLength } from '../modules/shared/constraints/is-exact-length.constraint';
import { IsUnique } from '../modules/shared/constraints/is-unique.constraint';
import { ValidateUnlessUserRole } from '../modules/shared/constraints/validate-unless-user-role.constraint';
import { CreditEntity } from './credit.entity';
import { AddressWithServiceAreaEmbed } from './embed/address.embed';
import { DocumentEmbed } from './embed/document.embed';
import { InsuranceEmbed } from './embed/insurance.embed';
import { PaymentEmbed } from './embed/payment.embed';
import { ReferralEmbed } from './embed/referral.embed';
import { SpecialistScheduleEmbed } from './embed/schedule.embed';
import { FileEntity } from './file.entity';
import { MarketEntity } from './market.entity';

const MIN_MINOR_AGE = 5;
const MAX_MINOR_AGE = 17;

@Exclude()
export abstract class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @Column({ unique: true, nullable: true })
  @Index()
  @IsOptional()
  @IsEmail()
  @IsUnique({ message: 'isUniqueEmail' })
  @Expose()
  email: string;

  @Column({ unique: true })
  @Index()
  @IsOptional()
  @IsNumberString()
  @IsExactLength(10)
  @IsUnique({ message: 'isUniquePhoneNumber' })
  @Expose()
  @Transform((value) => (value ? numeric(value) : undefined), { toClassOnly: true })
  phoneNumber: string;

  @Column({ nullable: true })
  @Expose({ toClassOnly: true })
  password: string;

  @Column({ nullable: true })
  @IsOptional()
  @Expose()
  firstName: string;

  @Column({ nullable: true })
  @IsOptional()
  @Expose()
  lastName: string;

  @OneToOne(() => FileEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn()
  @Type(() => FileEntity)
  @Expose()
  avatar: FileEntity;

  @Column(() => AddressWithServiceAreaEmbed)
  @Type(() => AddressWithServiceAreaEmbed)
  @ValidateNested()
  @Expose()
  address: AddressWithServiceAreaEmbed;

  @Column({
    type: 'date',
    nullable: true,
    transformer: {
      from: (v) => v && parseISO(v),
      to: (v) => v && format(v, 'yyyy-MM-dd'),
    },
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @MinDate(new Date('1900-01-01'))
  @Expose()
  dob: Date;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  @IsOptional()
  @IsIn(enumValues(UserGender))
  @Expose()
  gender: UserGender;

  @Column({ nullable: true })
  @Expose({ toPlainOnly: true })
  timezone: string;

  @Column({ nullable: true })
  @Type(() => Date)
  @Expose()
  deactivationDate: Date;

  @Column({ nullable: true })
  @ValidateIf((o: PatientUser | SpecialistUser | StaffUser) => {
    return [PatientDeactivationReason.Other, SpecialistDeactivationReason.Other, StaffDeactivationReason.Other].includes(
      o.deactivationReason,
    );
  })
  @IsNotEmpty()
  @Expose()
  deactivationNote: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (value) => plainToClass(DocumentEmbed, value, { excludeExtraneousValues: true }),
      from: (value) => plainToClass(DocumentEmbed, value),
    },
  })
  @Type(() => DocumentEmbed)
  @ValidateNested()
  @ValidateIf((o: User) => !!o.documents)
  @Expose({ toPlainOnly: true })
  documents: DocumentEmbed[];

  @CreateDateColumn()
  @Type(() => Date)
  @Expose({ toPlainOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Type(() => Date)
  @Expose({ toPlainOnly: true })
  updatedAt: Date;

  get name(): string {
    return [this.firstName, this.lastName].join(' ');
  }

  abstract getRoles(direction?: SerializeDirectionEnum): UserRole[];

  @Expose({ toPlainOnly: true })
  isActive(): boolean {
    return !this.deactivationDate || isBefore(new Date(), this.deactivationDate);
  }

  getDocument(type: DocumentType): DocumentEmbed | undefined {
    return (this.documents || []).find((d) => d.type === type);
  }

  updateDocument(document: DocumentEmbed): void {
    const documents = this.documents || [];

    const documentIdx = documents.findIndex((d) => d.type === document.type);

    if (documentIdx === -1) {
      documents.push(document);
    } else {
      documents[documentIdx] = document;
    }

    this.documents = documents;
  }

  isDocumentComplete(type: DocumentType): boolean {
    const document = this.getDocument(type);
    return document && document.completedAt instanceof Date && isPast(document.completedAt);
  }

  isHIPAACompliant(): boolean {
    const doc = this.getDocument(DocumentType.HIPAA);
    return doc && isAfter(doc.completedAt, subDays(new Date(), 365));
  }

  isBBPCompliant(): boolean {
    const doc = this.getDocument(DocumentType.BBP);
    return doc && isAfter(doc.completedAt, subDays(new Date(), 365));
  }
}

@Entity({ orderBy: { createdAt: 'DESC' } })
@MarketFilterable({
  query: (qb, markets) => {
    qb.innerJoin(`${qb.alias}.address.serviceArea`, 'sa');
    qb.innerJoin('sa.market', 'm');
    qb.andWhere('m.id IN (:...markets)', { markets: (markets ?? []).map((market) => market.id) });
  },
})
@Exclude()
export class PatientUser extends User {
  @Column({ nullable: true })
  @Expose()
  notes: string;

  @Column({ nullable: true })
  @Expose()
  priorIssues: string;

  @Column()
  @Expose({ toPlainOnly: true })
  referralCode: string;

  @Column(() => InsuranceEmbed)
  @Type(() => InsuranceEmbed)
  @ValidateNested()
  @Expose()
  insurance: InsuranceEmbed;

  @Column(() => PaymentEmbed)
  @Type(() => PaymentEmbed)
  @ValidateNested()
  @Expose({ toPlainOnly: true })
  paymentProfile: PaymentEmbed;

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      from: (value) =>
        castArray(value)
          .filter(Boolean)
          .map((referral) => plainToClass(ReferralEmbed, referral)),
      to: (value) =>
        castArray(value)
          .filter(Boolean)
          .map((referral) => plainToClass(ReferralEmbed, referral)),
    },
  })
  @IsOptional()
  @Type(() => ReferralEmbed)
  @IsInstance(ReferralEmbed, { each: true })
  @ValidateNested({ each: true })
  @Expose()
  partnerReferral: ReferralEmbed[];

  @Column({ nullable: true, type: 'enum', enum: PatientDeactivationReason })
  @IsOptional()
  @IsIn(enumValues(PatientDeactivationReason))
  @Expose()
  deactivationReason: PatientDeactivationReason;

  @OneToMany(() => CreditEntity, (credit) => credit.recipient, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
    onDelete: 'CASCADE',
  })
  @Transform(
    (credits) => {
      return credits
        ? getValidatedCredits(credits).reduce((collector, credit) => {
            collector += credit.currentAmount;
            return collector;
          }, 0)
        : 0;
    },
    {
      toPlainOnly: true,
    },
  )
  @Expose({ toPlainOnly: true })
  credits: CreditEntity[];

  @Column({ nullable: true })
  @ValidateIf((o: PatientUser) => o.isMinor)
  @IsNotEmpty({ message: 'Guardian name required for minors' })
  @Expose()
  guardianName: string;

  @Column({ nullable: true })
  @ValidateIf((o: PatientUser) => o.isMinor)
  @IsNotEmpty({ message: 'Guardian relationship required for minors' })
  @Expose()
  guardianRelationship: string;

  @Column({ nullable: true })
  @Type(() => Date)
  @Expose({ toPlainOnly: true })
  guardianConfirmationAt: Date;

  /* Only validate the guardian confirmation if the user is a minor and the guardian name or relationship is being changed */
  @ValidateIf((o: PatientUser) => o.isMinor && (!!o.guardianName || !!o.guardianRelationship))
  @Equals(true, { message: 'Guardian confirmation must be set' })
  @Expose()
  set guardianConfirmation(isConfirmed: boolean) {
    if (isConfirmed === true) {
      this.guardianConfirmationAt = new Date();
    } else if (isConfirmed === false) {
      this.guardianConfirmationAt = null;
    }
  }

  get guardianConfirmation() {
    return !!this.guardianConfirmationAt;
  }

  getRoles(direction): UserRole[] {
    const roles = [UserRole.Patient];

    switch (direction) {
      case SerializeDirectionEnum.TO_PLAIN:
        roles.push(UserRole.PatientRead);
        break;
      case SerializeDirectionEnum.TO_CLASS:
        roles.push(UserRole.PatientWrite);
        break;
    }

    return roles;
  }

  @Expose({ toPlainOnly: true })
  get isEligibleMinor(): boolean {
    if (!this.dob) {
      return false;
    }
    const age = differenceInYears(new Date(), this.dob);
    return age >= MIN_MINOR_AGE && age <= MAX_MINOR_AGE;
  }

  @Expose({ toPlainOnly: true })
  get isMinor(): boolean {
    if (!this.dob) {
      return false;
    }
    const age = differenceInYears(new Date(), this.dob);
    return age <= MAX_MINOR_AGE;
  }

  // Note: Do not store in the database.
  //
  // This particular value is a calculated hmac signature hash in the UserSubscriber afterLoad event and is used
  // to verify the identity of a user for Intercom interactions.
  @Expose({ toPlainOnly: true })
  intercomIdentityHash: string;
}

@Entity({ orderBy: { lastName: 'ASC', firstName: 'ASC' } })
@MarketFilterable({
  query: (qb, markets) => {
    qb.innerJoin(`${qb.alias}.markets`, 'm');
    qb.andWhere('m.id IN (:...markets)', { markets: (markets ?? []).map((market) => market.id) });
  },
})
@Exclude()
export class SpecialistUser extends User {
  @ManyToMany(() => MarketEntity, { eager: true, cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'specialist_user_market',
  })
  @Type(() => MarketEntity)
  @IsOptional()
  @IsInstance(MarketEntity, { each: true })
  @Expose({ groups: [UserRole.AdminStaffWrite, UserRole.StaffRead] })
  markets: MarketEntity[];

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (value) => plainToClass(SpecialistScheduleEmbed, value, { excludeExtraneousValues: true }),
      from: (value) => plainToClass(SpecialistScheduleEmbed, value),
    },
  })
  @Type(() => SpecialistScheduleEmbed)
  @ValidateNested()
  @IsOptional()
  @Expose({ groups: [UserRole.Staff] })
  schedule: SpecialistScheduleEmbed;

  @Column({ nullable: true, type: 'enum', enum: SpecialistDeactivationReason })
  @IsOptional()
  @IsIn(enumValues(SpecialistDeactivationReason))
  @Expose()
  deactivationReason: SpecialistDeactivationReason;

  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  isBookable(): boolean {
    // Determines if the user has met all the criteria in order to be bookable
    return [this.isActive(), this.isHIPAACompliant(), this.isBBPCompliant(), this.isScheduled()].every((result) => result === true);
  }

  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  isAvailable(): boolean {
    // Determines if the user is available for patients to book
    return this.isBookable() && (this.schedule?.exposeHours ?? false);
  }

  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  isScheduled(): boolean {
    return ![
      this.schedule?.monday,
      this.schedule?.tuesday,
      this.schedule?.wednesday,
      this.schedule?.thursday,
      this.schedule?.friday,
      this.schedule?.saturday,
      this.schedule?.sunday,
    ].every((day) => day && day.disabled === true);
  }

  getRoles(direction): UserRole[] {
    const roles = [UserRole.Specialist];

    switch (direction) {
      case SerializeDirectionEnum.TO_PLAIN:
        roles.push(UserRole.SpecialistRead);
        break;
      case SerializeDirectionEnum.TO_CLASS:
        roles.push(UserRole.SpecialistWrite);
        break;
    }

    return roles;
  }
}

@Entity({ orderBy: { lastName: 'ASC', firstName: 'ASC' } })
@Exclude()
export class StaffUser extends User {
  @ManyToMany(() => MarketEntity, { eager: true, cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'staff_user_market',
  })
  @Type(() => MarketEntity)
  @IsOptional()
  @IsInstance(MarketEntity, { each: true })
  @Expose({ groups: [UserRole.AdminStaffWrite, UserRole.StaffRead] })
  markets: MarketEntity[];

  @Column({ type: 'enum', enum: AccessLevel })
  @IsIn(enumValues(AccessLevel))
  @Expose({ groups: [UserRole.AdminStaff, UserRole.SupportStaffRead] })
  accessLevel: AccessLevel;

  @Column({ nullable: true, type: 'enum', enum: StaffDeactivationReason })
  @IsOptional()
  @IsIn(enumValues(StaffDeactivationReason))
  @Expose()
  deactivationReason: StaffDeactivationReason;

  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  @Expose()
  contact: boolean;

  getRoles(direction): UserRole[] {
    const roles = [UserRole.Staff, this.accessLevel === AccessLevel.Administrator ? UserRole.AdminStaff : UserRole.SupportStaff];

    switch (direction) {
      case SerializeDirectionEnum.TO_PLAIN:
        roles.push(
          UserRole.StaffRead,
          this.accessLevel === AccessLevel.Administrator ? UserRole.AdminStaffRead : UserRole.SupportStaffRead,
        );
        break;
      case SerializeDirectionEnum.TO_CLASS:
        roles.push(
          UserRole.StaffWrite,
          this.accessLevel === AccessLevel.Administrator ? UserRole.AdminStaffWrite : UserRole.SupportStaffWrite,
        );
        break;
    }

    return roles;
  }
}
