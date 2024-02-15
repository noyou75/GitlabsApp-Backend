import { Provider, Type } from '@nestjs/common';
import { TrackedEntities } from '../decorators/use-analytics.decorator';

/**
 * EneityAnalyticsManagerProvider is a class that manages the asynchronous tasks associated with assembling
 * dynamic IEntityAnalyticsManager implementations as injectable providers.
 */
export class EntityAnalyticsManagerProvider {
  /**
   * Retrieves the full set of tracked entity / manager mappings; once the mappings are fully populated, this method
   * builds Provider definitions for each IEntityAnalyticsManager implementation.
   */
  public static async getAnalyticsManagerProviders(): Promise<Provider[]> {
    return Promise.all(TrackedEntities.map(trackDef => trackDef.analyticsManagerPromise)).then(providers => {
      return providers.map(provider => {
        return {
          provide: provider.name,
          useClass: provider,
        };
      });
    });
  }

  /**
   * Retrieves the IEntityAnalyticsManager injection token that corresponds to the supplied type.
   */
  public static getAnalyticsManagerToken(type: Type<any>): string {
    return TrackedEntities.find(trackedDef => type === trackedDef.type)?.analyticsManagerToken;
  }
}
