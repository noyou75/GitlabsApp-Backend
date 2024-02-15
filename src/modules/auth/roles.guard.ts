import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from '../../common/enums/user-role.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { User } from '../../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<UserRole[]>('guard:roles', context.getHandler());

    if (!roles) {
      return true;
    }

    const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);
    const hasRole = () => user.getRoles().some(role => roles.includes(role));

    return user && user.getRoles() && hasRole();
  }
}
