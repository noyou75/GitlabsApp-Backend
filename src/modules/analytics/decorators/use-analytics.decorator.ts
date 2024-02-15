import { Type } from '@nestjs/common';
import { IEntityAnalyticsManager } from '../types/abstract-entity-analytics.manager';

/**
 * This object will be used to track a given analytics manager for a given type.
 */
interface EntityTracker<T> {
  type: Type<T>;
  analyticsManagerPromise: Promise<Type<IEntityAnalyticsManager<T>>>;
  analyticsManagerToken: string;
}

/**
 * Provides indices of the set of entities that are tracked by via the @AnalyticsManager decorator
 */
export const TrackedEntities: EntityTracker<any>[] = new Array<EntityTracker<any>>();

/**
 * The AnalyticsManager decorator identifies an IEntityAnalyticsManager implementation that is used to perform
 * analytics management tasks on a given entity (supplied via the decorator parameter).
 */
export function AnalyticsManager<T>(managedType: Type<any>) {
  let promiseResolve;

  /* Create a new tracking definition for the decorated manager class for the supplied entity type. */
  const trackDef: EntityTracker<T> = {
    type: managedType,
    /* Registration of the manager implementation is asynchronous, as we will not have insight into the class until
     * after this initial function runs.  Thus, we use an asynchronous approach to register the usage of the
     * analytics module within the consuming module. */
    analyticsManagerPromise: new Promise<Type<IEntityAnalyticsManager<T>>>(resolve => {
      promiseResolve = resolve;
    }),
    analyticsManagerToken: null,
  };

  TrackedEntities.push(trackDef);

  return (type: Type<IEntityAnalyticsManager<any>>) => {
    /* On type initialization, populate the tracking object with the supplied manager so we can
     * bootstrap our dynamic module. */
    trackDef.analyticsManagerToken = type.name;
    promiseResolve(type);
  };
}
