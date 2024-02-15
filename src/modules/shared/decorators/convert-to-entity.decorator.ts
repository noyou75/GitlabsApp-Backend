import { ExecutionContext, NotFoundException, Type } from '@nestjs/common';
import { CUSTOM_ROUTE_AGRS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { Request } from 'express';
import { FindOneOptions, getConnection } from 'typeorm';

export interface EntityConverterOptions {
  /**
   * Name of the connection to be used in TypeORM. Defaults to "default" connection.
   */
  connection?: string;

  /**
   * Entity type. Automatically retrieved from the parameter type, but in some cases it should be
   * passed explicitly. (ex. generics).
   */
  type?: Type<any>;

  /**
   * Request parameter to use as the identifier to find by. Defaults to "id" parameter.
   */
  param?: string;

  /**
   * Property to find by. If not specified, then the entity will be fetched by its primary keys.
   */
  findBy?: string;

  /**
   * Indicate if the entity value is optional. A NotFoundException is will be thrown if the entity
   * value is not optional and it cannot be found in the database.
   *
   * TODO: Use @Optional decorator provided by Nest?
   */
  optional?: boolean;

  /**
   * Extra find options to query with
   */
  findOneOptions?: FindOneOptions;
}

//
// TODO: This needs to be rewritten to use custom param decorators in Nest: https://docs.nestjs.com/custom-decorators
//

export function ConvertToEntity(options?: EntityConverterOptions): ParameterDecorator {
  return (target, property, index) => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, property) || {};
    const type = options && options.type ? options.type : Reflect.getMetadata('design:paramtypes', target, property)[index];
    const param = options && options.param ? options.param : 'id';
    const required = !options || (options && !options.optional);
    const findOneOptions = options && options.findOneOptions ? options.findOneOptions : {};

    Reflect.defineMetadata(
      ROUTE_ARGS_METADATA,
      {
        ...args,
        [`${randomStringGenerator()}${CUSTOM_ROUTE_AGRS_METADATA}:${index}`]: {
          index,
          factory: async (data: unknown, ctx: ExecutionContext) => {
            const repository = getConnection(options ? options.connection : undefined).getRepository(type);
            try {
              const req = ctx.switchToHttp().getRequest<Request>();

              if (!req.params[param]) {
                if (required) {
                  throw new Error(`Unable to use undefined value to find required ${type.name} entity!`);
                }
                return null;
              }

              const entity =
                options && options.findBy
                  ? await repository.findOne({ [options.findBy]: req.params[param] }, findOneOptions)
                  : await repository.findOne(req.params[param], findOneOptions);

              if (required && !entity) {
                throw new Error(`Unable to find required ${type.name} entity!`);
              }

              return entity;
            } catch (err) {
              throw new NotFoundException();
            }
          },
        },
      },
      target.constructor,
      property,
    );
  };
}
