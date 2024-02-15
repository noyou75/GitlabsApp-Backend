import { AbstractAnalyticsEvent } from '../abstract-analytics.event';
import { AbstractEventProcessor, EventOperators } from '../../reporting/util/event.processor';

/**
 * Superclass for all event processors that handle analytics events.
 */
export class AnalyticsEventProcessor<T> extends AbstractEventProcessor<T, AbstractAnalyticsEvent> {
  constructor(
    events: EventOperators<T, AbstractAnalyticsEvent>,
    options: {
      noOpUndefined?: boolean;
    },
  ) {
    super(events, options);
  }
}
