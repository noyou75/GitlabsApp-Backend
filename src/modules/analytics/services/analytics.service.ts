import {Injectable} from '@nestjs/common';
import {plainToClass} from 'class-transformer';
import {Redis} from 'ioredis';
import {v4 as uuid} from 'uuid';
import { REQUEST_CONTEXT_ANALYTICS_EVENT_PROPERTIES, REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import {ReferralEmbed, ReferrerType} from '../../../entities/embed/referral.embed';
import {User} from '../../../entities/user.entity';
import {LoggerService} from '../../core/services/logger.service';
import {RedisService} from '../../core/services/redis.service';
import {IAnalyticsEvent} from '../abstract-analytics.event';
import {AnalyticsContext} from '../context/analytics.context';
import {AnalyticsResponseDto, WebEntryDto, WebEntryResponseDto} from '../dto/analytics.dto';
import {WebEntryAnalyticsEvent} from '../events/web-entry-analytics.event';
import {MixpanelService} from './mixpanel.service';

/**
 * Primary interface for consumers performing analytics-related tasks (to promote a more technology-agnostic approach,
 * do not use MixpanelServie directly).
 */
@Injectable()
export class AnalyticsService {
  private readonly redisClient: Redis;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly mixpanelService: MixpanelService,
    private readonly analyticsContext: AnalyticsContext,
    redisService: RedisService,
  ) {
    this.redisClient = redisService.getClient();
  }

  /**
   * Tracks the supplied details as the circumstances under which the indicated user arrived at Getlabs.  Places
   * referral info into Redis (as our staging platform) for 72 hours; if the user signs up /
   * makes changes to their profile in this timeframe, we will propagate these details to their persisted
   * profile.
   */
  public async webEntry(webEntryDto: WebEntryDto): Promise<WebEntryResponseDto> {
    /* Track the web entry event in mixpanel - this method will generate a unique ID for us if one isn't already
     * present. */
    const { distinct_id } = this.trackEvent(new WebEntryAnalyticsEvent(webEntryDto));


    /* Retrieve the existing referral */
    let referral = await this.getReferral(distinct_id);

    /* If the inbound web entry event is a referral, we will need to ensure the unique ID is tracked.  If the user
     * is already tracked, and we're not dealing with a partner referral, don't track them.  Otherwise, we will need to track them. */

    if (!referral || webEntryDto.referrerType === ReferrerType.Partner ||
      (referral.referralMethod !== ReferrerType.Partner && webEntryDto.referrerType === ReferrerType.Peer)) {
      /* Create a new redis entry for the supplied web entry method */
      referral = plainToClass(ReferralEmbed, {
        partner: webEntryDto.data?.referrer,
        analyticsTokens: [distinct_id],
        referralDate: new Date(),
        referralMethod: webEntryDto.referrerType,
        data: webEntryDto.data,
      });

      /* Do not persist referrals that indicate refresh/app traversal activities.  We still create the object transiently, as the consumer
       * is always expecting a valid return value, but these activities are not valuable to retain otherwise. */
      this.isPersistableReferral(webEntryDto) &&
        (await this.redisClient.set(
          this.getReferralKey(distinct_id),
          JSON.stringify(referral),
          'PX',
          // 3 days (1000 milliseconds in a second * 60 seconds in a minute * 60 minutes in an hour * 24 hours in a day * 3 days)
          1000 * 60 * 60 * 24 * 3,
        ));
    }

    return {
      distinct_id,
      referral: referral,
    };
  }

  /**
   * Obfuscation of mixpanelService#trackEvent - consumers should invoke this method instead of invoking the mixpanel method
   * directly.  This is a move to make our analytics implementation technology-agnostic.
   */
  public trackEvent(event: IAnalyticsEvent, actor?: User): AnalyticsResponseDto {
    const reqUser = RequestContext.get<User>(REQUEST_CONTEXT_USER);
    const eventProperties = RequestContext.get<any>(REQUEST_CONTEXT_ANALYTICS_EVENT_PROPERTIES);

    /* The actor parameter is optional because the distinct_id may already be set as part of the supplied event's specific logic. If it's
     * not set in the event, we will allow consumers to specifically indicate which actor corresponds to this event.  If this value is not
     * supplied, we will check to see if the user is authenticated; if so, we can get their distinct_id from the request context. */
    /* ID preference order is:
     * 1. Whatever comes with the request/event object
     * 2. The acting user's ID, if available
     * 3. A newly generated UUID */
    event.getData().distinct_id =
      event.getData().distinct_id || this.analyticsContext.getAnalyticsToken() || (actor || reqUser)?.id || uuid();

    /* If the user is authenticated, we will need to track that... we also want to demonstrate a preference towards tracking
     * against the user's account ID (which will be aliased against their distinct_id(s)) - we'll manage that here. */
    event.getData().isAuthenticated = !!reqUser && (!actor || actor.id === reqUser.id);

    /* If extra event properties are passed in the header track them with the event */
    if (eventProperties) {
      Object.assign(event.getData(), { ...eventProperties, ...event.getData() });
    }

    return this.mixpanelService.trackEvent(event);
  }

  /**
   * Obfuscation of mixpanelService#setAlias - consumers should invoke this method instead of invoking the mixpanel method
   * directly.  This is a move to make our analytics implementation technology-agnostic.
   */
  public setAlias(id: string, userOrAlias: User | string) {
    this.mixpanelService.setAlias(id, userOrAlias);
  }

  /**
   * Retrieves referral info from Redis.
   */
  public async getReferral(token: string): Promise<ReferralEmbed> {
    /* Query redis for the supplied token */
    const tokenData = await this.redisClient.get(this.getReferralKey(token));

    /* If the query mapped to any data, transform this to a PartnerReferral object, and return accordingly. */
    try {
      return tokenData ? plainToClass(ReferralEmbed, JSON.parse(tokenData)) : null;
    } catch (err) {
      this.loggerService.warn(`Encountered an error while retrieving referral data for tokenId ${token}: ${err}`);
    }
  }

  private isPersistableReferral(webEntry: WebEntryDto) {
    return webEntry.referrerType !== ReferrerType.InterAppTraversal && webEntry.referrerType !== ReferrerType.Refresh;
  }

  private getReferralKey(distinctId: string) {
    return `Referral:${distinctId}`;
  }
}
