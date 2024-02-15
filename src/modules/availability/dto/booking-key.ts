import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

@Exclude()
export class BookingKey {
  @IsOptional()
  @IsString()
  @Expose()
  specialist: string | undefined;

  @Type(() => Date)
  @IsDate()
  @Expose()
  startAt: Date;

  @Type(() => Date)
  @IsDate()
  @Expose()
  endAt: Date;

  @IsNumber()
  @Expose()
  price: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  priority?: boolean;

  constructor(specialist: string | undefined, startAt: Date, endAt: Date, price: number, priority?: boolean) {
    this.specialist = specialist;
    this.startAt = startAt;
    this.endAt = endAt;
    this.price = price;
    this.priority = priority;
  }
}
