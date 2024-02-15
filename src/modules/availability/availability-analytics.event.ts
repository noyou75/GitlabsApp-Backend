import { AbstractAnalyticsEvent } from '../analytics/abstract-analytics.event';

export class OutOfServiceAreaEvent extends AbstractAnalyticsEvent {
  private static EventName = 'Availability Out of Service Area';
  constructor(zip: string) {
    super(OutOfServiceAreaEvent.EventName, { zipCode: zip });
  }
}
