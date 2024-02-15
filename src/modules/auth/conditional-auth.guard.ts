import { ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AuthGuardExceptionCondition } from './exclude-auth-guard.decorator';

abstract class AbstractConditionalAuthGuard extends AuthGuard() {
  @Inject()
  protected reflector: Reflector;
}

/**
 * ConditionalAuthGuard implements an AuthGuard instance on the decorated class, and allows the
 * consumer to specify scenarios when the auth guard should be ignored.  These scenarios can either
 * be class-level (i.e. attached as a condition to the decorator via the factoryCondition parameter), or
 * handler-level (implemented through applying ExcludeAuthGuard to a given handler.
 */
export function ConditionalAuthGuard(factoryCondition?: AuthGuardExceptionCondition) {
  return class extends AbstractConditionalAuthGuard {
    private handleAuth(context: ExecutionContext, exemption: AuthGuardExceptionCondition) {
      return (result?: boolean | object) => {
        /* Once the parent authentication process completes, access is granted as described below:
         * If authenticated, permitted immediately.
         * If not authenticated, check the factory condition supplied when assembling this guard.
         * If the factory condition is not defined/returns false, check the individual handler exemption. */
        return result === true || (factoryCondition && factoryCondition(context)) || (!!exemption && exemption(context));
      };
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      /* Mandatory that we call super.canActivate so the user's jwt token is placed in contextizzle. */
      const activate = super.canActivate(context);
      const exemption = this.reflector.get<AuthGuardExceptionCondition>('guard:exclude-auth', context.getHandler());

      /* If activate is a promise/observable, we must handle the negative case. */
      return typeof activate === 'boolean'
        ? activate
        : ((activate instanceof Observable ? activate.toPromise() : (activate as Promise<boolean>))
            .then(this.handleAuth(context, exemption))
            .catch(this.handleAuth(context, exemption)) as Promise<boolean>);
    }
  };
}
