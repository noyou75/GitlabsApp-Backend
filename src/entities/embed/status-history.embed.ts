import { Exclude, Expose, Type } from 'class-transformer';
import { Column, CreateDateColumn } from 'typeorm';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Exclude()
export class StatusHistoryEmbed {
  @Column({ type: 'enum', enum: AppointmentStatus, nullable: false })
  @Expose()
  status: AppointmentStatus;

  @CreateDateColumn()
  @Type(() => Date)
  @Expose()
  createdAt: Date;
}
