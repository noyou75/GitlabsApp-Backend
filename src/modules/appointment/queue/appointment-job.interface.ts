import { AppointmentCancellationReason } from '../../../common/enums/appointment-cancellation-reason.enum';
import { JobDescription } from '../../job/services/abstract-queue.service';

/**
 * Base type that contains data injected into appointment jobs.
 */
interface AppointmentJobDescriptor {
  appointmentId: string;
}

/**
 * Contains the various appointment job operations types.
 */
export enum AppointmentJobOperationTypes {
  autocancel = 'autocancel',
}

/**
 * This is an interface that is specifically used by the auto cancel deferred task; this contains the parameters
 * that are used to describe why a given appointment is cancelled.
 */
export interface AppointmentCancellationParams {
  reason?: AppointmentCancellationReason;
  note?: string;
}

/**
 * Job execution descriptor - this is used to describe the data that is actually injected into the appointment job.  This
 * differs from the other definition of AppointmentJobDescription in that it contains ID values rather than full
 * objects, as those objects must be retrieved from the DB during job execution.
 */
export type AppointmentJobExecutionDescription = JobDescription<AppointmentJobDescriptor>;
