import { Exclude, Expose } from 'class-transformer';
import { IsIn, IsNumber } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { UserRole } from '../common/enums/user-role.enum';
import { AppointmentEntity } from './appointment.entity';
import { CreditEntity } from './credit.entity';
import { PatientUser, StaffUser, User } from './user.entity';

export enum CreditTransactionReason {
  CreditRevoked = 'CreditReversed',
  CreditRedemption = 'CreditRedemption',
  CreditRefunded = 'CreditRefunded',
}

@Entity({
  name: 'credit_transaction',
})
@Exclude()
export class CreditTransactionEntity {
  @Column()
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  public id: string;

  @ManyToOne(() => CreditEntity, (credit) => credit.transactions, {
    nullable: false,
    eager: false,
  })
  @JoinColumn()
  public credit: CreditEntity;

  @CreateDateColumn()
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  public createdAt: Date;

  @RelationId((creditTransactionEntity: CreditTransactionEntity) => creditTransactionEntity.order)
  public orderId: string;

  /* This field is identified as AppointmentEntity for now, but should really be transformed to a ManyToOne column containing the order
   * details.  The order will contain a set of product IDs (with Product prospectively being an interface implemented by entities),
   * and product types.  For now, we will leave this as AppointmentEntity, as the hypothetical Order framework would be part of a
   * broader refactoring, and AppointmentEntity is currently the only class that implements Product (i.e. leaving this as AppointmentEntity
   * allows us to chase the path with the least resistance and greatest data integrity for the time being). */
  @ManyToOne(() => AppointmentEntity)
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public order?: AppointmentEntity;

  @Column()
  @IsNumber()
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public amount: number;

  @Column({ type: 'enum', enum: CreditTransactionReason })
  @IsIn(enumValues(CreditTransactionReason))
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public reason: CreditTransactionReason;

  @ManyToOne(() => StaffUser, {
    nullable: true,
    eager: false,
  })
  public staffUser?: StaffUser;

  @ManyToOne(() => PatientUser, {
    nullable: true,
    eager: false,
  })
  public patientUser?: PatientUser;

  public setUser(user: User) {
    // Doing the same thing as the audit log entity object for now:
    // Use "if" type guards until switch or constructor type guards are supported
    // See: https://github.com/Microsoft/TypeScript/issues/23274

    if (user instanceof StaffUser) {
      this.staffUser = user;
    } else if (user instanceof PatientUser) {
      this.patientUser = user;
    } else {
      throw new TypeError(`Unsupported User type: ${user.constructor.name}`);
    }
  }

  get user() {
    return this.staffUser || this.patientUser;
  }

  set user(user: User) {
    this.setUser(user);
  }
}
