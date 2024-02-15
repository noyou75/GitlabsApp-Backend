import { User } from '../../../entities/user.entity';
import { AbstractUserAnalyticsEvent } from '../user-analytics.event';

/**
 * Describes an analytics event that's fired whenever a potential patient inputs an address that is outside of our service area.
 */
export class OutOfServiceAreaEvent extends AbstractUserAnalyticsEvent {
  private static EventName = 'Patient Out of Service Area';

  constructor(targetUser: User, actor: User) {
    super(OutOfServiceAreaEvent.EventName, { zipCode: targetUser.address.zipCode }, targetUser, actor);
  }
}
