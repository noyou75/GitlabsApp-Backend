import { AbstractAnalyticsEvent } from '../abstract-analytics.event';
import { WebEntryDto } from '../dto/analytics.dto';

export class WebEntryAnalyticsEvent extends AbstractAnalyticsEvent {
  public static EventName = 'Web Entry';

  constructor(webEntryDto: WebEntryDto) {
    super(WebEntryAnalyticsEvent.EventName, {
      ...webEntryDto,
    });
  }
}
