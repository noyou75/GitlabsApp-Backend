import { forwardRef, Inject, Injectable, LoggerService as ILoggerService } from '@nestjs/common';
import { format as strFormat } from 'util';
import * as winston from 'winston';
import { ConfigService } from './config.service';

@Injectable()
export class LoggerService implements ILoggerService {
  private readonly logger: winston.Logger;

  public constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      silent: false, // Should this be silent in 'test' mode?
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.combine(winston.format.timestamp(), winston.format.json())
          : winston.format.combine(winston.format.colorize(), winston.format.simple()),
      transports: [
        new winston.transports.Console({
          stderrLevels: ['error'],
        }),
      ],
    });
  }

  format(message: string, ...params: any[]): string {
    return strFormat(message, ...params);
  }

  debug(message: string, ...params: any[]): void {
    this.logger.debug(this.format(message, ...params));
  }

  info(message: string, ...params: any[]): void {
    this.logger.info(this.format(message, ...params));
  }

  log(message: string, ...params: any[]): void {
    this.info(message, ...params);
  }

  warn(message: string, ...params: any[]): void {
    this.logger.warn(this.format(message, ...params));
  }

  error(message: string, trace?: string, ...params: any[]): void {
    this.logger.error(this.format(message, ...params));

    if (trace) {
      this.logger.error(trace);
    }
  }
}
