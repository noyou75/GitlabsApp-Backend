import { ExecutionContext, SetMetadata } from '@nestjs/common';

export type AuthGuardExceptionCondition = (context: ExecutionContext) => boolean;

/**
 * Decorator that permits a given handler to exclude the AuthGuard that is applied either globally or on the controller level.
 * This decorator may be configured with a condition, which determines when the auth guard should be ignored (returns false).
 * If this condition is not supplied, this decorator will always disable the auth guard for the attached handler.
 */
export const ExcludeAuthGuard = (condition?: () => boolean) => SetMetadata('guard:exclude-auth', condition || (() => true));
