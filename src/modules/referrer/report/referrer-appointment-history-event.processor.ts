import { differenceInSeconds } from 'date-fns';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AppointmentHistoryEvent, AppointmentHistoryEventProcessor } from '../../appointment/reporting/appoinmtent-history-event.processor';
import { ReferrerReportRow, SessionDescription } from './referrer-report.row';

/**
 * Convenience method that wraps a processor method in another function that manages returning the inbound session.
 * Definite lazy-person move.
 */
const wrapReturn = (cb: (s: ReferrerReportRow, e: AppointmentHistoryEvent) => void) => {
  return (session: SessionDescription, appointmentEvent: AppointmentHistoryEvent): SessionDescription => {
    /* Invoke the supplied CB */
    cb(session, appointmentEvent);

    /* Return the session */
    return session;
  };
};

/**
 * Defines a set of appointment history processors for the referrers report.
 */
export class ReferrerAppointmentHistoryEventProcessor extends AppointmentHistoryEventProcessor<ReferrerReportRow> {
  constructor() {
    super({
      [AppointmentStatus.InProgress]: wrapReturn((session, entry) => (session.startAt = entry.historyEvent.createdAt)),

      [AppointmentStatus.Collected]: wrapReturn((session, entry) => (session.drawnAt = entry.historyEvent.createdAt)),

      [AppointmentStatus.Completed]: (session, entry) => {
        session.deliveredAt = entry.historyEvent.createdAt;

        /* Events are processed in chronological order; this means that we can now safely deduce the drawn delivery duration. */
        session.drawnDeliveredDuration =
          session.drawnAt && session.deliveredAt ? differenceInSeconds(session.deliveredAt, session.drawnAt) : null;

        return session;
      },

      [AppointmentStatus.Cancelled]: wrapReturn((session, entry) => (session.cancelledAt = entry.historyEvent.createdAt)),
    });
  }
}
