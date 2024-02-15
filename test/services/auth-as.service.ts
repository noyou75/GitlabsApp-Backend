import { Injectable } from '@nestjs/common';
import { ClassType } from 'class-transformer/ClassTransformer';
import { Plugin, SuperAgentRequest } from 'superagent';
import { User } from '../../src/entities/user.entity';
import { AuthService } from '../../src/modules/auth/auth.service';

@Injectable()
export class AuthenticateAsService {
  constructor(private readonly authService: AuthService) {}

  async authenticateAs(type: ClassType<User>, username: string): Promise<Plugin> {
    const auth = this.authService;
    const token = auth.signToken(auth.createToken(await auth.loadUserByPhoneNumber(type, username)));
    return (request: SuperAgentRequest) => {
      request.set('Authorization', `Bearer ${token}`);
    };
  }
}
