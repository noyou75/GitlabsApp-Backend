import { Exclude, Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';

export enum OptInType {
  CouponCodes = 'CouponCodes',
}

@Exclude()
export class OptInDto {
  @Expose()
  @IsIn(enumValues(OptInType))
  optInType: OptInType;
}
