import { User } from '../../entities/user.entity';
import { ActorAnalyticsEvent, ActorAnalyticsEventData } from '../analytics/abstract-analytics.event';

/**
 * An abstract definition that describes the general shape of analytics events that relate directly to the user entity in some way.
 */
export abstract class AbstractUserAnalyticsEvent extends ActorAnalyticsEvent {
  protected constructor(name: string, data: ActorAnalyticsEventData, targetUser: User, actor: User) {
    super(name, data, targetUser, actor);
  }
}
