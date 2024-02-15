import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Scope } from '@sentry/hub';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces';

interface SentryInterceptorFilter {
  type: any;
  filter?: (exception: any) => boolean;
}

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        error: err => {
          if (this.shouldCapture(err)) {
            Sentry.withScope(scope => {
              switch (context.getType()) {
                case 'http':
                  return this.captureHttpException(scope, context.switchToHttp(), err);
                case 'rpc':
                  return this.captureRpcException(scope, context.switchToRpc(), err);
                case 'ws':
                  return this.captureWsException(scope, context.switchToWs(), err);
                default:
                  return this.captureException(scope, err);
              }
            });
          }
        },
      }),
    );
  }

  private shouldCapture(exception: any): boolean {
    const filters: SentryInterceptorFilter[] = [
      {
        type: HttpException,
        // Filter out statuses less than 400 and also 401, 404 specifically
        filter: (e: HttpException) => e.getStatus() < 400 || [401, 404].includes(e.getStatus()),
      },
    ];

    return filters.every(({ type, filter }) => {
      return !(exception instanceof type && (!filter || filter(exception)));
    });
  }

  private captureHttpException(scope: Scope, http: HttpArgumentsHost, exception: any): void {
    const data = Sentry.Handlers.parseRequest({}, http.getRequest());

    scope.setExtra('req', data.request);
    data.extra && scope.setExtras(data.extra);

    if (data.user) {
      scope.setUser(data.user);
    }

    scope.setUser({
      ...scope.getUser(),
      ip: http.getRequest().ip,
    });

    this.captureException(scope, exception);
  }

  private captureRpcException(scope: Scope, rpc: RpcArgumentsHost, exception: any): void {
    scope.setExtra('rpc_data', rpc.getData());

    this.captureException(scope, exception);
  }

  private captureWsException(scope: Scope, ws: WsArgumentsHost, exception: any): void {
    scope.setExtra('ws_client', ws.getClient());
    scope.setExtra('ws_data', ws.getData());

    this.captureException(scope, exception);
  }

  private captureException(scope: Scope, exception: any): void {
    Sentry.captureException(exception);
  }
}
