import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { AuthService } from '../auth.service';
import { Token } from './token.interface';
import { ConfigService } from '../../core/services/config.service';
import { User } from '../../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService, private readonly auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('SECRET'),
    });
  }

  async validate(token: Token): Promise<User> {
    const user = await this.auth.loadUserFromToken(token);

    if (!user) {
      throw new UnauthorizedException();
    }

    RequestContext.set(REQUEST_CONTEXT_USER, user);

    return user;
  }
}
