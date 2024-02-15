import { ValidateIf, ValidationOptions } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { User } from '../../../entities/user.entity';

/* Ignore validation for the passed roles */
export const ValidateIfUserRole = (roles: UserRole[], validationOptions?: ValidationOptions) => {
  return ValidateIf(() => {
    const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);
    return user && user.getRoles().some((r) => roles.includes(r));
  }, validationOptions);
};
