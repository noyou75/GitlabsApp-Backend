import { Injectable } from '@nestjs/common';
import { REQUEST_CONTEXT_ANALYTICS_TOKEN, RequestContext } from '../../../common/request-context';

/**
 * Service is in place as a bridging measure between request-scoped services and having to use RequestContext.  Once the
 * request-scoped services are able to work with passport strategies, RequestContext will be eliminated, and this
 * service will move to a request-scoped context.
 */
@Injectable({})
export class AnalyticsContext {
  constructor() {}

  /**
   * Retrieves the analytics token that may be present in the request header... if the consumer did not supply an
   * analytics token, this method will return undefined.
   */
  public getAnalyticsToken(): string {
    return RequestContext.get(REQUEST_CONTEXT_ANALYTICS_TOKEN);
  }
}
