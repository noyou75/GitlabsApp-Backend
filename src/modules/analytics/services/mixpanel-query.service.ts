import { Injectable, Type } from '@nestjs/common';
import { zonedTimeToUtc } from 'date-fns-tz';
import { default as MixpanelApi } from 'mixpanel-data-export-node';
import { extend } from 'lodash';
import { AbstractAnalyticsEvent, AnalyticsEventData } from '../abstract-analytics.event';
import { MixpanelConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Describes analytics events exported from Mixpanel via the export API.
 */
export interface MixpanelAnalyticsEvent {
  event: string;
  properties: AnalyticsEventData;
}

/**
 * Search structure for querying data from Mixpanel.
 */
export interface QueryData {
  event: Array<string>;
  from_date: string;
  to_date: string;
  where?: string;
}

/**
 * Describes mappings between event name and event class (to be provided by consumer)
 */
export interface EventMappings {
  [key: string]: Type<AbstractAnalyticsEvent>;
}

/**
 * Generic service that facilitates the querying of the Mixpanel batch export API.
 */
@Injectable()
export class MixpanelQueryService {
  private readonly api: MixpanelApi;

  constructor(private readonly configService: ConfigService, private readonly loggerService: LoggerService) {
    this.api = new MixpanelApi({
      api_secret: this.configService.get(MixpanelConfig.MixpanelApiSecret),
    });
  }

  /**
   * Queries the Mixpanel batch export API with the supplied query shape.  The supplied event mappings indicate event name ->
   * object type mappings.
   */
  queryEvents(queryData: QueryData, eventMappings: EventMappings, options: { ascending: boolean } = { ascending: true }) {
    const operator = options.ascending ? 1 : -1;

    return this.api
      .export(queryData)
      .then((eventResults: Array<MixpanelAnalyticsEvent>) => {
        return eventResults
          .map(eventResult => {
            /* Retrieve the type that maps to this particular raw event obj. */
            let type = eventMappings[eventResult.event];

            /* If a direct mapping did not turn up any results, attempt a partial match, which may apply in cases of
             * related events. */
            if (!type) {
              const eventTypeKey = Object.keys(eventMappings).find(etk => eventResult.event.indexOf(etk));
              type = (eventTypeKey && eventMappings[eventTypeKey]) || eventMappings.Default;
            }

            /* Use reflection to build an object that corresponds to the identified AnalyticsEvent type,
             * and assign the identified properties... */
            const eventObj = Reflect.construct(Object, [], type);
            extend(eventObj, {
              name: eventResult.event,
              data: {
                ...eventResult.properties,
                time: this.getUtcDateTime(eventResult.properties.time),
              },
            });

            return eventObj;
          })
          .sort((a, b) => (a.data.time === b.data.time ? 0 : a.data.time > b.data.time ? operator : operator * -1));
      })
      .catch(err => {
        this.loggerService.error(`Unable to retrieve booking flow events from Mixpanel: ${err}`);
        throw new Error(`Could not retrieve booking flow events from Mixpanel: ${err}`);
      });
  }

  private getUtcDateTime(timestamp: number) {
    /* Convert from the mixpanel second-based version of the timestamp.
     * Also deals with the troublesome offset factor - mixpanel stores event times in the project's local time, thus a conversion
     * back to UTC is required. */
    return zonedTimeToUtc(new Date(timestamp * 1000), this.configService.get(MixpanelConfig.MixpanelEventTimezone));
  }
}
