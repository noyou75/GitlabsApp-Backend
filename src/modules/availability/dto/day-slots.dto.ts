import { Exclude, Expose } from 'class-transformer';
import { TimeslotDto } from './timeslot.dto';

@Exclude()
export class DaySlotsDto {
  @Expose()
  date: Date;

  @Expose()
  slots: TimeslotDto[];

  constructor(date: Date, slots: TimeslotDto[] = []) {
    this.date = date;
    this.slots = slots;
  }
}
