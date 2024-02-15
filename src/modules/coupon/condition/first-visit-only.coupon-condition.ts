import { Injectable } from '@nestjs/common';
import { getRepository, Not } from 'typeorm';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { CouponConditionEnum } from '../../../common/enums/coupon-condition.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { PatientUser } from '../../../entities/user.entity';
import { CouponCondition } from './coupon-condition.decorator';
import { CouponConditionInterface } from './coupon-condition.interface';

@Injectable()
@CouponCondition(CouponConditionEnum.FirstVisitOnly)
export class FirstVisitOnlyCouponCondition implements CouponConditionInterface {
  async isEligible(user: PatientUser): Promise<boolean> {
    return (await getRepository(AppointmentEntity).count({ where: { patient: user, status: Not(AppointmentStatus.Cancelled) } })) === 0;
  }
}
