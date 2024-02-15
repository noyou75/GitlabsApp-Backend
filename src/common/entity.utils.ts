import { Type } from '@nestjs/common';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { DeepPartial, getConnection } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

export const isSameEntity = (entity1?: { id?: string }, entity2?: { id?: string }) => {
  return entity1 && entity2 && entity1.id === entity2.id && entity1.constructor === entity2.constructor;
};

/**
 * Determines if the supplied column(s) is/are present in the supplied column/relation metadata
 * @private
 */
const _includesColumn = (columns: ColumnMetadata[] | RelationMetadata[], columnNames: string | string[]): boolean => {
  columnNames = Array.isArray(columnNames) ? columnNames : [columnNames];

  for (const column of columnNames) {
    if (
      columns.some(metadata => {
        return metadata.propertyPath === column;
      })
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Determines if the supplied column(s) are present in the supplied column metadata
 */
export const includesColumn = (columns: ColumnMetadata[], columnNames: string | string[]): boolean => {
  return _includesColumn(columns, columnNames);
};

/**
 * Determines if the supplied column(s) are present in the supplied relation metadata
 */
export const includesRelation = (columns: RelationMetadata[], columnNames: string | string[]): boolean => {
  return _includesColumn(columns, columnNames);
};

export const loadRelationsForPlainKeys = async <E>(
  target: Type<E>,
  data: DeepPartial<E>,
  ensureType?: boolean,
  serializeOptions?: ClassTransformOptions,
): Promise<DeepPartial<E>> => {
  const conn = getConnection();

  const entity = ensureType && !(data instanceof target) ? plainToClass(target, data, serializeOptions) : data;

  if (conn.hasMetadata(target)) {
    const metadata = conn.getMetadata(target);

    for (const relation of metadata.relations) {
      const relationObj = await Promise.resolve(relation.getEntityValue(entity));

      if (typeof relationObj === 'string') {
        relation.setEntityValue(entity, await conn.getRepository(relation.type).findOneOrFail(relationObj));
      }
    }
  }

  return entity as DeepPartial<E>;
};
