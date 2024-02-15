import { Exclude, Expose, Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { Column } from 'typeorm';

@Exclude()
export class DateRangeEmbed {
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Expose()
  public startDate?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Expose()
  public endDate?: Date;
}
