import { Injectable } from '@nestjs/common';
import { format } from 'util';
import { AppointmentCancellationReason } from '../../../common/enums/appointment-cancellation-reason.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { RedisService } from '../../core/services/redis.service';
import {
  AbstractJobSchedulerService,
  JobSchedulingArguments,
  RepeatJobSchedulingArguments,
  TrackedJobDescription,
} from '../../job/services/abstract-job-scheduler.service';
import { RepeatType } from '../../job/types/repeat-type';
import { AppointmentCancellationParams } from '../queue/appointment-job.interface';
import { AppointmentJobDescription, AppointmentQueueService, RepeatAppointmentJobDescription } from './appointment-queue.service';

/**
 * Implementation of AppointmentJobDescription, which is a TrackedJobDescription carrying a payload of AppointmentEntity.
 * This implementation specifically manages the generation of context-sensitive job indexing keys.
 */
class AppointmentJobDescriptionImpl implements AppointmentJobDescription, TrackedJobDescription<AppointmentEntity> {
  public data: AppointmentEntity;
  public name = '';

  private static readonly AppointmentJobKeyTpl = 'Appointment:%s';
  constructor(jobDesc: AppointmentJobDescription, public namespace: string[]) {
    this.data = jobDesc.data;
    this.name = jobDesc.name;
  }

  getKey() {
    return AppointmentJobDescriptionImpl.getKey(this.data);
  }

  public static getKey(appointment: AppointmentEntity) {
    return format(AppointmentJobDescriptionImpl.AppointmentJobKeyTpl, appointment.id);
  }
}

/**
 * Implementation of RepeatAppointmentJobDescription, which is a RepeatTrackedJobDescription carrying a payload of AppointmentEntity.
 * This implementation specifically manages the generation of context-sensitive job indexing keys.
 */
class RepeatAppointmentJobDescriptionImpl extends AppointmentJobDescriptionImpl implements RepeatAppointmentJobDescription {
  public timezone: string;
  public strikeDate: Date;

  constructor(jobDesc: RepeatAppointmentJobDescription, namespace?: string[]) {
    super(jobDesc, namespace);
    this.timezone = jobDesc.timezone;
    this.strikeDate = jobDesc.strikeDate;
  }
}

/**
 * Definition of an interface that describes cancel deferred jobs.
 */
export interface CancelAppointmentJobDescription extends AppointmentJobDescription, AppointmentCancellationParams {}

/**
 * Implementation of CancelAppointmentJobDescription; this is a TrackedJobDescription carrying a payload of AppointmentEntity.
 * This implementation specifically manages the generation of context-sensitive job indexing keys.
 */
class CancelAppointmentJobDescriptionImpl extends AppointmentJobDescriptionImpl implements CancelAppointmentJobDescription {
  public note = 'Appointment cancelled automatically by the system.';
  public reason = AppointmentCancellationReason.Other;

  constructor(jobDesc: CancelAppointmentJobDescription, namespace?: string[]) {
    super(jobDesc, namespace);

    /* If note and/or reason are defined, set those here... */
    this.note = jobDesc.note || this.note;
    this.reason = jobDesc.reason || this.reason;
  }
}

/**
 * AppointmentJobSchedulerService is a subclass of AbstractJobSchedulerService, and serves as the main interface used to
 * schedule appointment jobs on the appointment execution queue.  This implementation provides context-sensitive methods
 * for extracting job execution data from job descriptions.
 *
 * Consumers of this service should use appropriate interface of AppointmentJobDescription for the job they wish to
 * schedule.
 */
@Injectable()
export class AppointmentJobSchedulerService extends AbstractJobSchedulerService {
  constructor(appointmentQueueService: AppointmentQueueService, redisService: RedisService) {
    super(appointmentQueueService, redisService);
  }

  /**
   * Retrieves the job execution arguments that pertain to one-time appointment jobs according to the consumer-supplied
   * AppointmentJobDescription.
   */
  protected getJobArguments(jobDesc: AppointmentJobDescription, namespace?: string[]): JobSchedulingArguments {
    return {
      jobDescription: new AppointmentJobDescriptionImpl(jobDesc, namespace),
    };
  }

  /**
   * Retrieves the job execution arguments that pertain to repeat appointment jobs according to the consumer-supplied
   * RepeatAppointmentJobDescription.
   */
  protected getRepeatJobArguments(
    jobDesc: RepeatAppointmentJobDescription,
    namespace: string[],
    repeatType?: RepeatType,
  ): RepeatJobSchedulingArguments {
    return {
      jobDescription: new RepeatAppointmentJobDescriptionImpl(jobDesc, namespace),
      repeatType,
    };
  }

  /**
   * Retrieves the job description instance that describe the job(s) to cancel according to the consumer-supplied
   * CancelAppointmentJobDescription.
   */
  protected getCancelJobDescription(jobDesc: CancelAppointmentJobDescription, namespace: string[]): TrackedJobDescription<any> {
    return new CancelAppointmentJobDescriptionImpl(jobDesc, namespace);
  }
}
