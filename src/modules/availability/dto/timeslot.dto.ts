import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';

@Exclude()
export class TimeslotDto {
  @Expose()
  key: string;

  @Expose()
  start: Date;

  @Expose()
  end: Date;

  @Expose()
  price: number;

  // This property indicates if this slot has already been booked, and is exposed on Team
  // to indicate slots that would cause a specialist to be double booked.
  @Expose({ groups: [UserRole.Staff] })
  booked: boolean;

  // This property indicates a priority slot that requires the user to upload a lab order
  @Expose()
  priority: boolean;

  constructor(key: string, start: Date, end: Date, price: number, booked: boolean = false, priority: boolean = false) {
    this.key = key;
    this.start = start;
    this.end = end;
    this.price = price;
    this.booked = booked;
    this.priority = priority;
  }
}
