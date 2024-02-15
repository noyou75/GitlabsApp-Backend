import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { AppointmentCancellationReason } from '../../../common/enums/appointment-cancellation-reason.enum';

export class AppointmentCancelDto {
  @IsNotEmpty()
  @IsIn(enumValues(AppointmentCancellationReason))
  reason: AppointmentCancellationReason;

  @ValidateIf((o: AppointmentCancelDto) => o.reason === AppointmentCancellationReason.Other)
  @IsNotEmpty()
  note: string;
}
