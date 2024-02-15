import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { User } from '../../../entities/user.entity';

@Injectable()
@ValidatorConstraint({ name: 'isRequiredForUserType', async: false })
export class IsRequiredForUserRoleConstraint implements ValidatorConstraintInterface {
  constructor() {}

  validate(value: any, args: ValidationArguments): boolean {
    const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);

    return !(!value && user.getRoles().some(r => args.constraints[0].includes(r)));
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `$property is required`;
  }
}

export const IsRequiredForUserRole = (roles: UserRole[], validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [roles],
      validator: IsRequiredForUserRoleConstraint,
    });
  };
};
