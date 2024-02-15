import { Exclude, Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { CouponConditionEnum } from '../common/enums/coupon-condition.enum';
import { CouponType } from '../common/enums/coupon.enum';
import { DiscountType } from '../common/enums/discount-type.enum';
import { UserRole } from '../common/enums/user-role.enum';

@Entity({
  name: 'coupon',
})
@Exclude()
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  id: string;

  private _code: string;

  @Column({ unique: true })
  @Expose()
  get code(): string {
    return this._code;
  }

  set code(code: string) {
    this._code = code?.toUpperCase();
  }

  @Column()
  @Expose()
  discount: number;

  @Column({ type: 'enum', enum: DiscountType })
  @IsIn(enumValues(DiscountType))
  @Expose()
  discountType: DiscountType;

  @Column({ default: true })
  @Expose({ groups: [UserRole.Staff] })
  isActive: boolean;

  @Column({ nullable: true })
  @Expose({ groups: [UserRole.Staff] })
  validFrom: Date;

  @Column({ nullable: true })
  @Expose({ groups: [UserRole.Staff] })
  validTo: Date;

  @Column({ type: 'enum', enum: CouponConditionEnum, array: true, nullable: true })
  @IsIn(enumValues(CouponConditionEnum), { each: true })
  @Expose({ groups: [UserRole.Staff] })
  conditions: CouponConditionEnum[];

  @Column({ type: 'enum', enum: CouponType })
  @IsIn(enumValues(CouponType))
  @Expose({ groups: [UserRole.Staff] })
  couponType: CouponType;
}
