import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-anonymous';

/**
 * The passport-anonymous strategy allows us to expose endpoints to unauthenticated users, but still permit the population of
 * strategy-derived JWT data if it's available (when used in conjunction with JwtStrategy).
 */
@Injectable()
export class AnonymousStrategy extends PassportStrategy(Strategy) {
  async validate(): Promise<null> {
    return null;
  }
}
