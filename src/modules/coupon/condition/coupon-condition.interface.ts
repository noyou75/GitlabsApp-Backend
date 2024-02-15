import { PatientUser } from '../../../entities/user.entity';

export interface CouponConditionInterface {
  isEligible(user: PatientUser): Promise<boolean>;
}
