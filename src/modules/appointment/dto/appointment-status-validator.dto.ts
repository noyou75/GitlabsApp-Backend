import { IsIn } from 'class-validator';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';

export function ValidateStatus(appointment: AppointmentEntity, statuses: AppointmentStatus | AppointmentStatus[]) {
  class ValidatorHost {
    @IsIn(Array.isArray(statuses) ? statuses : [statuses])
    status: AppointmentStatus = appointment.status;
  }

  return ValidatorHost;
}
