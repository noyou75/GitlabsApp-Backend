import { createNamespace } from 'cls-hooked';
import { secureid } from './string.utils';
import { StringEncoderService } from '../modules/shared/services/string-encoder.service';

const ns = createNamespace(secureid());

export const REQUEST_CONTEXT_REQUEST_ID = 'request-id';
export const REQUEST_CONTEXT_IP_ADDRESS = 'request-ip';
export const REQUEST_CONTEXT_USER = 'user';
export const REQUEST_CONTEXT_ANALYTICS_TOKEN = 'analytics-token';
export const REQUEST_CONTEXT_ANALYTICS_EVENT_PROPERTIES = 'analytics-event-properties';
export const REQUEST_CONTEXT_MARKETS = 'markets';

// TODO: This should be converted to a Request scoped service, which did not exist in NestJs at the time this was written

export class RequestContext {
  public static middleware(req, res, next) {
    ns.run(() => {
      ns.set(REQUEST_CONTEXT_REQUEST_ID, secureid());
      ns.set(REQUEST_CONTEXT_IP_ADDRESS, req.ip);
      ns.set(REQUEST_CONTEXT_ANALYTICS_TOKEN, req.header('x-analytics-token'));
      ns.set(
        REQUEST_CONTEXT_ANALYTICS_EVENT_PROPERTIES,
        !req.header('x-analytics-event-properties')
          ? null
          : StringEncoderService.base64JsonDecode(req.header('x-analytics-event-properties')),
      );
      ns.set(REQUEST_CONTEXT_MARKETS, req.header('x-markets'));
      next();
    });
  }

  public static set<T>(key: string, val: T) {
    if (ns && ns.active) {
      ns.set(key, val);
    }
  }

  public static get<T>(key: string): T {
    if (ns && ns.active) {
      return ns.get(key);
    }
  }
}
