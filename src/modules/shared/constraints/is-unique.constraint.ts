import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { getRepository } from 'typeorm';

@Injectable()
@ValidatorConstraint({ name: 'isUnique', async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const repo = getRepository(args.targetName);

    const conditions: { [key: string]: any } = {
      [args.property]: value,
    };

    // if composite constraint add the other properties
    if (Array.isArray(args.constraints?.[0])) {
      for (const property of args.constraints?.[0]) {
        conditions[property] = (args.object as any)[property];
      }
    }

    let entities = await repo.find(conditions);

    if (repo.hasId(args.object)) {
      entities = entities.filter(entity => repo.getId(entity) !== repo.getId(args.object));
    }

    return entities.length === 0;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return '$property must be unique';
  }
}

export interface IsUniqueConstraintConstraintOptions extends ValidationOptions {
  // Allows for a composite unique check, ideally this will be at the class level if/when class-validator supports it
  compositeProperties?: string[];
}

export const IsUnique = (validationOptions?: IsUniqueConstraintConstraintOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [validationOptions?.compositeProperties || null],
      validator: IsUniqueConstraint,
    });
  };
};
