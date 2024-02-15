import { Type } from '@nestjs/common';
import { EntityMetadata, getRepository } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { EmbeddedMetadata } from 'typeorm/metadata/EmbeddedMetadata';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

const FilterableMetadataKey = 'FilterableMetadataKey';

const getFilterableKeys = (type: Type<any>) => Reflect.getMetadata(FilterableMetadataKey, type) || [];

/** Marks a given property as filterable in a standard CrudService-based list query.  All fields that are meant to be filterable (via the
 * 'filters' list query option) must be decorated with this annotation.
 */
export const Filterable = () => {
  return (prototype: any, propertyName: string) => {
    /* Determine whether or not metadata already exists for the supplied type. */
    const filterableKeys = getFilterableKeys(prototype);

    /* Add the supplied property name as a queryable key on this type */
    filterableKeys.push(propertyName);

    Reflect.defineMetadata(FilterableMetadataKey, filterableKeys, prototype);
  };
};

/** Interface for querying filterable details about a given entity. */
export class FilterableManager {
  /**
   * Determines if the supplied property on the supplied entity is filterable through the CrudService list query
   * method (i.e. is decorated with the @Filterable() annotation.
   */
  public static isFilterable(obj: Type<any>, propertyKey: string) {
    /* Filterable is set on instance properties of entities, thus the metadata is set against the hosting object's prototype. */
    let prototype = obj.prototype;

    while (prototype) {
      /* Check through the prototype chain until we find the property we are seeking... */
      const queryableKeys = getFilterableKeys(prototype);

      /* Check the metadata on the supplied type for the queryable metadata  */
      if (queryableKeys.includes(propertyKey)) {
        return true;
      }

      prototype = Object.getPrototypeOf(prototype);
    }

    /* If we get here, we did not find the requested property on the supplied object's prototype chain metadata. Return false. */
    return false;
  }

  /**
   * Retrieves the column metadata for the supplied property on the supplied entity.  If the supplied property is not
   * marked as filterable, this method will return null.
   */
  public static getFilterableColumnMetadata(targetType: Type<any>, propertyKey: string, targetTypeMetadata?: EmbeddedMetadata) {
    /* First, determine if the supplied column is queryable. */
    if (!FilterableManager.isFilterable(targetType, propertyKey)) {
      return null;
    }

    const compareRelationColumnName = (relation: ColumnMetadata | RelationMetadata | EmbeddedMetadata) =>
      relation.propertyName === propertyKey;

    let metadata: EntityMetadata | EmbeddedMetadata = null;

    try {
      /* Interrogate the supplied type's entity metadata to get the column or relation metadata defined for the column
       * at the supplied key. */
      metadata = getRepository(targetType).metadata;
    } catch (err) {
      /* If the above fails, we are likely dealing with an embedded column.  In that case, we are going to return a barebones object
       * that fits the common contract of column metadata. */
      metadata = targetTypeMetadata;
    }

    /* If we get here and metadata is still null, it means that the supplied entity is queried in such a way where the
     * target property's metadata cannot be resolved. */
    return (
      (metadata && metadata.relations.find(compareRelationColumnName)) ||
      metadata.columns.find(compareRelationColumnName) ||
      metadata.embeddeds.find(compareRelationColumnName)
    );
  }
}
