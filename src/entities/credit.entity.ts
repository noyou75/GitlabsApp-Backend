import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInstance, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { CreditSourceEnum } from '../common/enums/credit-source.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { IsLessThanProperty } from '../modules/shared/constraints/is-less-than-property.constraint';
import { CreditTransactionEntity } from './credit-transaction.entity';
import { DateRangeEmbed } from './embed/date-range.embed';
import { PatientUser, StaffUser } from './user.entity';

@Entity({
  name: 'credit',
  orderBy: {
    'validDateRange.endDate': {
      order: 'ASC',
      nulls: 'NULLS LAST',
    },
  },
})
@Exclude()
export class CreditEntity {
  @Column()
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn()
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public createdAt: Date;

  @ManyToOne(() => StaffUser, {
    eager: false,
    nullable: true,
  })
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public createdBy: StaffUser;

  @Column({ type: 'enum', enum: CreditSourceEnum })
  @IsIn(enumValues(CreditSourceEnum))
  @Expose({ groups: [UserRole.Staff] })
  public source: CreditSourceEnum;

  @Column()
  @IsNumber()
  @IsInt()
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public originalAmount: number;

  @Column()
  @IsNumber()
  @IsInt()
  @IsLessThanProperty('originalAmount', { equals: true })
  @Expose({ groups: [UserRole.Staff] })
  public currentAmount: number;

  @Column(() => DateRangeEmbed)
  @Type(() => DateRangeEmbed)
  @IsOptional()
  @ValidateNested()
  @Expose({ groups: [UserRole.Staff] })
  public validDateRange: DateRangeEmbed;

  @Column({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  public isActive: boolean;

  @ManyToOne(() => PatientUser, (user) => user.credits, {
    nullable: false,
    eager: false,
  })
  public recipient: PatientUser;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Expose({ groups: [UserRole.Staff] })
  public notes: string;

  /* Note that this is not concurrency-safe, as this is presently not a significant concern with our current/near future volumes.  We should
   * refactor the code that accesses and writes this field to be concurrency-safe at a later point though, when it becomes evident that
   * concurrent resource mutations can feasibly occur. */
  @OneToMany(() => CreditTransactionEntity, (transaction) => transaction.credit, {
    cascade: ['insert', 'update', 'remove'],
    eager: true,
    onDelete: 'CASCADE',
  })
  @Type(() => CreditTransactionEntity)
  @IsInstance(CreditTransactionEntity, { each: true })
  @ValidateNested()
  @Expose({ groups: [UserRole.Staff], toPlainOnly: true })
  public transactions: CreditTransactionEntity[];

  getAppliedAmount() {
    return this.originalAmount - this.currentAmount;
  }
}
