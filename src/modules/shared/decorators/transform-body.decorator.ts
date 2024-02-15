import { BadRequestException, ExecutionContext, Type } from '@nestjs/common';
import { CUSTOM_ROUTE_AGRS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { Request } from 'express';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { loadRelationsForPlainKeys } from '../../../common/entity.utils';
import { SerializeDirectionEnum } from '../../../common/enums/serialize-direction.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { User } from '../../../entities/user.entity';

export interface BodyTransformerOptions {
  /**
   * Entity type. Automatically retrieved from the parameter type, but in some cases it should be
   * passed explicitly (ex. generics).
   */
  type?: Type<any>;

  /**
   * Body property to use as value to transform. Defaults to entire body.
   */
  property?: string;
}

//
// TODO: This needs to be rewritten to use custom param decorators in Nest: https://docs.nestjs.com/custom-decorators
//

export function TransformBody(options?: BodyTransformerOptions): ParameterDecorator {
  return (target, property, index) => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, property) || {};
    const type = options && options.type ? options.type : Reflect.getMetadata('design:paramtypes', target, property)[index];
    const prop = options && options.property ? options.property : null;

    Reflect.defineMetadata(
      ROUTE_ARGS_METADATA,
      {
        ...args,
        [`${randomStringGenerator()}${CUSTOM_ROUTE_AGRS_METADATA}:${index}`]: {
          index,
          factory: async (_: unknown, ctx: ExecutionContext) => {
            const req = ctx.switchToHttp().getRequest<Request>();

            const data = prop ? req.body[prop] : req.body;

            // TODO: This should probably be done in the serializer interceptor
            const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);

            try {
              return await loadRelationsForPlainKeys(type, data, true, {
                groups: user ? user.getRoles(SerializeDirectionEnum.TO_CLASS) : [],
              });
            } catch (err) {
              if (err instanceof EntityNotFoundError) {
                throw new BadRequestException(err.message);
              } else {
                throw err;
              }
            }
          },
        },
      },
      target.constructor,
      property,
    );
  };
}
