import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';

export const getActionTimestamp = (appointment: AppointmentEntity, status: AppointmentStatus) => appointment.statusHistory
  .find(historyEntry => historyEntry.status === status)?.createdAt;
