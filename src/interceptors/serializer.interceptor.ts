import { ClassSerializerInterceptor, Injectable, PlainLiteralObject } from '@nestjs/common';
import { ClassTransformOptions } from 'class-transformer';
import { merge } from 'lodash';
import { SerializeDirectionEnum } from '../common/enums/serialize-direction.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../common/request-context';
import { User } from '../entities/user.entity';

type ResponseType = PlainLiteralObject | PlainLiteralObject[];

@Injectable()
export class SerializerInterceptor extends ClassSerializerInterceptor {
  serialize(response: ResponseType, options: ClassTransformOptions): ResponseType {
    return super.serialize(response, merge(this.getTransformOptions(), options));
  }

  private getTransformOptions(): ClassTransformOptions {
    const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);
    return {
      groups: user ? user.getRoles(SerializeDirectionEnum.TO_PLAIN) : [],
    };
  }
}
