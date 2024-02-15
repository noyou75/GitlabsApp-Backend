import { isBefore } from 'date-fns';
import { AbstractAnalyticsEvent, AnalyticsEventData } from '../../analytics/abstract-analytics.event';
import { WebEntryAnalyticsEvent } from '../../analytics/events/web-entry-analytics.event';
import { AppointmentBookingFlowEvent } from '../../appointment/appointment-analytics.event';
import { BookStep } from '../../appointment/dto/book-step.dto';
import { AnalyticsEventProcessor } from '../../analytics/report/analytics-event.processor';
import { SessionDescription } from './referrer-report.row';

export const AnalyticsEventKeys = {
  WebEntry: WebEntryAnalyticsEvent.EventName,
  BookFlowStart: AppointmentBookingFlowEvent.getEventName(BookStep.TimeslotSelection),
  BookFlowProfile: AppointmentBookingFlowEvent.getEventName(BookStep.Profile),
  BookFlowLabProvisioning: AppointmentBookingFlowEvent.getEventName(BookStep.LabOrderEntry),
  BookFlowPayment: AppointmentBookingFlowEvent.getEventName(BookStep.Payment),
  BookFlowConfirmation: AppointmentBookingFlowEvent.getEventName(BookStep.Confirmation),
};

/**
 * Defines an analytics processor for the app booking flow; meant to be specifically used with the referral report.
 */
export class BookingFlowAnalyticsEventProcessor extends AnalyticsEventProcessor<SessionDescription> {
  constructor() {
    super(
      {
        [AnalyticsEventKeys.BookFlowStart]: (target, event) => {
          target.bookingStart =
            !target.bookingStart || isBefore(event.getData().time, target.bookingStart) ? event.getData().time : target.bookingStart;
          return target;
        },
      },
      {
        noOpUndefined: true,
      },
    );
  }

  /* Override of process to implement specifics that apply to all booking flow steps... */
  process(target: SessionDescription, event: AbstractAnalyticsEvent<AnalyticsEventData>): Promise<any> | any {
    /* Do not bother processing WebEntry events... */
    if (event instanceof WebEntryAnalyticsEvent) {
      return target;
    }

    /* If the inbound step represents the furthest 'progressed' booking flow step, set it as such on the target. */
    target.lastViewedStep =
      !target.lastViewedStep ||
      typeof event.getData().ordinal !== 'number' ||
      event.getData().ordinal > target.lastViewedStep.getData().ordinal
        ? event
        : target.lastViewedStep;

    return super.process(target, event);
  }
}
