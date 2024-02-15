import { Optional } from '@nestjs/common';
import { Transform } from 'class-transformer';

/* Boolean indicates whether a given property should be NULL or NOT NULL; CrudFilter indicates a relation-populated or embedded object. */
export type CrudFilterFieldDefinition = boolean | any | any[] | CrudFilter<any>;

export type CrudFilter<T> = {
  [key in keyof T]?: CrudFilterFieldDefinition;
};

export class QueryOptionsDto<T> {
  @Optional()
  @Transform(encodedFilter => encodedFilter && JSON.parse(encodedFilter))
  filters?: CrudFilter<T>;
}
