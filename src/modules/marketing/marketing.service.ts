import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { PatientUser } from '../../entities/user.entity';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { AppointmentService } from '../appointment/appointment.service';
import { CouponService } from '../coupon/coupon.service';
import { OptInAnalyticsEvent } from './analytics/opt-in-analytics.event';
import { OptInHandler, OptInMetadataKey, OptInResult } from './decorators/opt-in.decorator';
import { OptInType } from './dto/opt-in.dto';

@Injectable()
export class MarketingService implements OnModuleInit {
  private optInOperators: { [key in OptInType]?: OptInHandler };

  constructor(
    private readonly couponService: CouponService,
    private readonly appointmentService: AppointmentService,
    private readonly discoveryService: DiscoveryService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  public async onModuleInit() {
    /* Retrieve all providers that have been annotated with the OptIn decorator */
    this.optInOperators = await this.discoveryService.providersWithMetaAtKey(OptInMetadataKey).then(providers => {
      /* Reduce the retrieved providers to a set that is keyed by their opt in type. */
      return providers.reduce((collected, provider) => {
        collected[provider.meta as string] = provider.discoveredClass.instance;
        return collected;
      }, {});
    });
  }

  public async optIn(user: PatientUser, type: OptInType): Promise<OptInResult> {
    /* Attempt to resolve the appropriate handler for the inbound type. */
    const handler = this.optInOperators[type];

    /* If there is no operator for the supplied type, throw an excpetion. */
    if (!handler) {
      throw new Error(`Cannot retrieve an operator type for ${type}; please ensure one is defined.`);
    }

    const result = await handler.optIn(user);

    /* Log the successful opt-in */
    result.optIn && this.analyticsService.trackEvent(new OptInAnalyticsEvent(type, user, RequestContext.get(REQUEST_CONTEXT_USER)));

    /* Invoke the handler's opt in method... */
    return result;
  }
}
