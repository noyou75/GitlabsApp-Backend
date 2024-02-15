import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { REQUEST_CONTEXT_IP_ADDRESS, REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { ReferralData, ReferralEmbed, ReferrerType } from '../../../entities/embed/referral.embed';
import { User } from '../../../entities/user.entity';
import { AnalyticsEventData, IAnalyticsEvent } from '../abstract-analytics.event';
import { extend } from 'lodash';

/**
 * Basic response DTO indicates the distinct_id used by mixpanel to track a given user.
 * May be either the mixpanel distinct id, or the user's id property.
 */
export class AnalyticsResponseDto {
  distinct_id: string;
}

export class WebEntryResponseDto extends AnalyticsResponseDto {
  referral: ReferralEmbed;
}

/**
 * Retrieves the current user from the request context, if available.
 */
const getRequestContextUser = (): User => RequestContext.get<User>(REQUEST_CONTEXT_USER) || null;

/**
 * AnalyticsEventDto is a simple IAnalyticsEvent implementation that is used to describe event objects dispatched by the
 * front end.
 */
@Exclude()
export class AnalyticsEventDto implements IAnalyticsEvent {
  @Expose()
  @IsString()
  @IsNotEmpty()
  private name: string;

  @Expose()
  @IsObject()
  @IsNotEmpty()
  @Transform(value => {
    return extend(value || {}, {
      ip: RequestContext.get<string>(REQUEST_CONTEXT_IP_ADDRESS),
      distinct_id: getRequestContextUser()?.id || value.distinct_id,
    });
  })
  private data: AnalyticsEventData;

  @Expose()
  @Transform(getRequestContextUser)
  private user: User;

  public getName() {
    return this.name;
  }

  public getData() {
    return this.data;
  }
}

/**
 * AnalyticsAliasDto is a basic DTO that is used when a user is registered with getlabs; it effectively indicates the old
 * Mixpanel distinct id that maps to the id of the user in context when the alias endpoint is invoked.
 */
export class AnalyticsAliasDto {
  distinct_id: string;
}

/**
 * Desribes the circumstances under which a given user arrived at Getlabs.
 */
@Exclude()
export class WebEntryDto {
  @Expose()
  @IsIn(enumValues(ReferrerType))
  referrerType: ReferrerType;

  @Expose()
  @IsOptional()
  @IsString()
  referrerUri: string;

  @Expose()
  @IsBoolean()
  isCrawler: boolean;

  @Expose()
  @IsOptional()
  @IsObject()
  data: ReferralData;

  @Expose()
  @IsNotEmpty()
  @IsString()
  domain: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  targetDestination: string;

  @Expose()
  @IsObject()
  @IsOptional()
  queryParams: { [key: string]: string | string[] };
}
