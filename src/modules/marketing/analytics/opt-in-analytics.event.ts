import { User } from '../../../entities/user.entity';
import { ActorAnalyticsEvent } from '../../analytics/abstract-analytics.event';
import { OptInType } from '../dto/opt-in.dto';

export interface OptInAnalyticsEventData {
  optInType: OptInType;
}

// TODO - The quarterly report task implements generics for this - once we merge that task back to master, let's update this event
//  set the above as the event's data type.
//
export class OptInAnalyticsEvent extends ActorAnalyticsEvent {
  constructor(optInType: OptInType, user: User, actor: User) {
    super('Opt-In: Complete', { optInType }, user, actor);
  }
}
