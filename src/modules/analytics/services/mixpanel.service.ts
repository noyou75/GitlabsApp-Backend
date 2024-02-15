import { Inject, Injectable } from '@nestjs/common';
import { Mixpanel } from 'mixpanel';
import { className } from '../../../common/class.utils';
import { MIXPANEL_CLIENT } from '../../../common/constants';
import { REQUEST_CONTEXT_IP_ADDRESS, RequestContext } from '../../../common/request-context';
import { User } from '../../../entities/user.entity';
import { LoggerService } from '../../core/services/logger.service';
import { AnalyticsResponseDto } from '../dto/analytics.dto';
import { IAnalyticsEvent } from '../abstract-analytics.event';

/**
 * Primary interface for sending events to mixpanel.
 */
@Injectable()
export class MixpanelService {
  constructor(@Inject(MIXPANEL_CLIENT) private readonly mixpanel: Mixpanel, private readonly loggerService: LoggerService) {}

  /**
   * Tracks the supplied event in mixpanel.  If the supplied event does not indicate a distinct_id, this method
   * will generate a new distinct_id.  The resulting distinct_id (whether included or generated) will be
   * supplied with the return object.
   */
  public trackEvent(event: IAnalyticsEvent): AnalyticsResponseDto {
    this.mixpanel.track(event.getName(), event.getData());

    return { distinct_id: event.getData().distinct_id };
  }

  /**
   * Associates the supplied user with the supplied Mixpanel distinct ID.  This allows consumers to specify the user's
   * ID as the distinct_id property for all user events going forward.
   */
  public setAlias(distinctId: string, userOrAlias: User | string) {
    // If user or alias is empty, just return
    if (!userOrAlias) return;

    /* Type narrowing... */
    let user = null;
    let alias: string = userOrAlias as string;

    if (userOrAlias instanceof User) {
      user = userOrAlias;
      alias = userOrAlias.id;
    }

    /* Associate the supplied distinct id/base alias with the supplied alias ID. */
    this.mixpanel.alias(distinctId, alias, (err) => {
      /* Aliasing failed - need to track why. */
      err &&
        this.loggerService.warn(
          `Could not alias the supplied ID ${distinctId} for user ${user?.id || 'undefined'}.  Attached details: ` + `${err.name}: ${err.message}`,
        );
    });

    /* If a user object is supplied, that means we are associating a new user account with the supplied distinct_id. In that case,
     * create a profile for this person. */
    if (user) {
      this.mixpanel.people.set(
        distinctId,
        {
          $first_name: user.firstName?.charAt(0),
          $last_name: user.lastName?.charAt(0),
          $created: new Date(),
          $ip: RequestContext.get(REQUEST_CONTEXT_IP_ADDRESS),
          actorType: className(user),
        },
        (err) => {
          err &&
            this.loggerService.warn(
              `Could not create a user profile for ${user.id} on distinct_id ${distinctId}.  ` +
                `Attached details: ${err.name}: ${err.message}`,
            );
        },
      );
    }
  }
}
