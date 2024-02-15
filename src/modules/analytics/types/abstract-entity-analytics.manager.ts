import { Inject } from '@nestjs/common';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { User } from '../../../entities/user.entity';
import { AbstractAnalyticsEvent } from '../abstract-analytics.event';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Interface for defining objects that manage a given entity's interactions with analytics.
 */
export interface IEntityAnalyticsManager<T> {
  /**
   * Tracks the creation of the supplied entity object.
   */
  trackCreate(entity: T): void;

  /**
   * Tracks changes to the supplied entity object.
   */
  trackUpdate(entity: T, changes: string[], old: T): void;

  /**
   * Tracks the deletion of the supplied entity object.
   */
  trackDelete(entity: T): void;
}

/**
 * Abstract implementation of IEntityAnalyticsManager that provides boilerplate functionality; this functionality includes
 * a track method that dispatches events to the analytics implementation, as well as a helper method for retrieving the user associated with
 * the invoked request context.
 */
export abstract class AbstractEntityAnalyticsManager<T> implements IEntityAnalyticsManager<T> {
  @Inject()
  protected readonly analyticsService: AnalyticsService;

  /**
   * Tracks the supplied analytics event with the analytics implementation.
   */
  public track(event: AbstractAnalyticsEvent): void {
    this.analyticsService.trackEvent(event);
  }

  /**
   * Retrieves the user that is associated with the current request context.
   */
  public getRequestContextUser(): User {
    return RequestContext.get<User>(REQUEST_CONTEXT_USER) || null;
  }

  public abstract trackCreate(entity: T): void;
  public abstract trackUpdate(entity: T, changes: string[], old: T): void;
  public abstract trackDelete(entity: T): void;
}
