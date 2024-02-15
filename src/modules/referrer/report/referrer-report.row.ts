import { AppointmentEntity } from '../../../entities/appointment.entity';
import { PatientUser } from '../../../entities/user.entity';
import { AppointmentBookingFlowEvent } from '../../appointment/appointment-analytics.event';

/**
 * Object shape for the part of the referrers report output that defines appointment-derived details.
 */
export interface AppointmentDescription {
  appointmentId?: string;
  specialistId?: string;
  bookedAt?: Date;
  startAt?: Date;
  drawnAt?: Date;
  deliveredAt?: Date;
  deliveredLocation?: string;
  drawnDeliveredDuration?: number;
  cancelledAt?: Date;
}

/**
 * Object shape for the part of the referrers report output that defines booking flow details.
 */
export interface BookingFlowDescription {
  distinct_id?: string;
  ipAddress?: string;
  sessionStart?: Date;
  bookingStart?: Date;
  user?: PatientUser;
  lastViewedStep?: AppointmentBookingFlowEvent;
}

/**
 * The output row object shape that combines booking flow details with appointment processing/history details.
 */
export interface ReferrerReportRow extends BookingFlowDescription, AppointmentDescription {}

/**
 * Maps to a single user session- for various reasons, a single user session may be mapped to multiple appointments, so we will
 * do our disambiguation in the ReportRow structure.
 */
export interface SessionDescription extends BookingFlowDescription {
  appointments: AppointmentEntity[];
}
