import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequestContext } from '../common/request-context';
import { LoggerService } from '../modules/core/services/logger.service';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  public constructor(private readonly logger: LoggerService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
    const startTime = new Date();
    const request = context.switchToHttp().getRequest<Request>();

    const rid = RequestContext.get('request-id');

    return next.handle().pipe(
      map((data) => {
        this.logger.log(
          `${LogInterceptor.getTimeDelta(startTime)}ms ${rid} ${request.ip} ${request.method} ${LogInterceptor.getUrl(request)}`,
        );
        return data;
      }),
      catchError((err) => {
        this.logger.error(
          `${LogInterceptor.getTimeDelta(startTime)}ms ${rid} ${request.ip} ${request.method} ${LogInterceptor.getUrl(request)}`,
        );
        return throwError(err);
      }),
    );
  }

  private static getTimeDelta(startTime: Date): number {
    return new Date().getTime() - startTime.getTime();
  }

  private static getUrl(request: Request): string {
    return `${request.protocol}://${request.get('host')}${request.originalUrl}`;
  }
}
