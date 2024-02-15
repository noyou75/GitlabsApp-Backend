import { Type } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { AbstractAnalyticsEvent } from '../analytics/abstract-analytics.event';

/**
 * An abstract class that defines the general shape of authentication analytics events...
 */
export abstract class AbstractAuthAnalyticsEvent extends AbstractAnalyticsEvent {
  protected constructor(name: string, role: Type<User>, source?: string) {
    super(name, {
      source,
      role: role.name,
    });
  }
}

/**
 * Describes an analytics event that is fired when a user requests an authentication code.
 */
export class AuthCodeRequestAnalyticsEvent extends AbstractAuthAnalyticsEvent {
  private static EventName = 'Authentication Code Requested';

  constructor(role: Type<User>, source?: string) {
    super(AuthCodeRequestAnalyticsEvent.EventName, role, source);
  }
}

/**
 * Describes an analytics event that is fired when a supplied authentication code passes validated.
 */
export class AuthCodeSuccessAnalyticsEvent extends AbstractAuthAnalyticsEvent {
  private static EventName = 'Authentication Successful';

  constructor(role: Type<User>, source?: string) {
    super(AuthCodeSuccessAnalyticsEvent.EventName, role, source);
  }
}

/**
 * Describes an analytics event that is fired when a supplied authentication code fails validation.
 */
export class AuthCodeFailedAnalyticsEvent extends AbstractAuthAnalyticsEvent {
  private static EventName = 'Authentication Failed';

  constructor(role: Type<User>, source?: string) {
    super(AuthCodeFailedAnalyticsEvent.EventName, role, source);
  }
}
