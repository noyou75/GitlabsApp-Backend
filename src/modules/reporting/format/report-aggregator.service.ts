import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { castArray } from 'lodash';

/**
 * The two ways of defining the entity that will be used to populate a given decorated column... The consumer
 * can supply a type constructor, or can supply an object containing an isType method.  The isType method will
 * be invoked with the entities with which the aggregator's 'populated' is invoked, and must return a boolean
 * indicating whether or not this populator definition should handle this entity.
 */
type PopulatingEntityTypeIdentifier<E = any> = Type<E> | { isType: ((obj: any) => boolean) };

/**
 * Defines the signature of the function that will ultimately return the value to be populated in the decorated property in
 * the aggregate row object returned by the aggregator.
 */
type PopulatorFunction<E, R> = (entity: E, params: any) => R;

/**
 * Defines a populator that makes use of NestJS injectables - the injectable tokens must be defined in the 'dependencies' array,
 * and will be injected into the factory function in the exact order as the 'dependencies' array.
 * The factory function must return a PopulatorFunction, which will be called with the bound entity and any defined report
 * parameters.
 */
type InjectablePopulator<E, R> = {
  dependencies: Array<any>;
  factory: (...args: any[]) => PopulatorFunction<E, R>;
};

/**
 * The base interface which is used to derive our two main populator interfaces, both of which will be used by consumers to define
 * aggregate row property population logic.
 */
interface BaseReportColumnPopulator<E> {
  entity: PopulatingEntityTypeIdentifier<E>;
}

/**
 * This interface describes the simple incarnation of the report column populator definition, in which the consumer simply provides
 * a 'populate' function, which is called with the bound entity and any defined report parameters.
 *
 * The aggregator framework will inevitably coerce all InjectableReportColumnPopulator shape objects to SimpleReportColumnPopulator
 * for uniform handling (with the result of the factory function with all dependencies injected, of course).
 */
interface SimpleReportColumnPopulator<E, R> extends BaseReportColumnPopulator<E> {
  populate: PopulatorFunction<E, R>;
}

/**
 * This interface describes a more complex incarnation of the report column populator definition, in which the consumer may define
 * NestJS injectables that may be used by the derived PopulatorFunction.
 *
 * To make use of this object shape, one must supply an array of dependencies and a factory function.  The dependencies will be
 * applied to the factory function as parameters in the same order as defined in the dependencies array, and the factory
 * function must return a PopulatorFunction.
 */
interface InjectableReportColumnPopulator<E, R> extends BaseReportColumnPopulator<E> {
  populate: InjectablePopulator<E, R>;
}

type ReportColumnPopulator<E, R> = SimpleReportColumnPopulator<E, R> | InjectableReportColumnPopulator<E, R>;

/**
 * The configuration object supplied as the param to the ReportColumn decorator
 *
 * R = data type of report col before it's exported (R as in "report")
 * P = data type of report col after it's exported (P as in "plain")
 * T = type of populator field (T as in "type"... as P is already being used)
 */
interface ReportColumnConfiguration<
  R,
  P = R,
  T extends (ReportColumnPopulator<any, R> | Array<ReportColumnPopulator<any, R>>) = Array<ReportColumnPopulator<any, R>>
> {
  header: string;
  populator: T;
  export?: (val: R) => P;
}

/**
 * Convenience method for consumers to define populator properties in their own usages of @ReportColumn... promotes type safety.
 *
 * E = the entity from which to harvest data in populating the decorated column.
 * R = The data type of the report column before it's exported
 */
export const getPopulator: <E, R>(
  type: PopulatingEntityTypeIdentifier<E>,
  populate: PopulatorFunction<E, R> | InjectablePopulator<E, R>
) => ReportColumnPopulator<E, R> = <E, R>(type: Type<E>, populate: (entity: E) => R) => {
  return {
    entity: type,
    populate,
  }
};

/**
 * Internal metadata structure that is used to index the column metadata defined on a given report format.
 */
interface ReportColumnMetadata<T extends Array<ReportColumnPopulator<any, any>> = Array<ReportColumnPopulator<any, any>>> {
  [key: string]: ReportColumnConfiguration<any, any, T>;
}

/**
 * Internal metadata key for storing the above-noted metadata structure.
 */
const ReportColumnMetadataKey = 'ReportColumnMetadataKey';

/**
 * Property decorator - defines a column within a given ReportAggregateFormat object.  This decorator is used to define various aspects
 * concerning the column, including the heading, population details, and export transformation details.
 *
 * R = data type of report col before it's exported (R as in "report")
 * P = data type of report col after it's exported (P as in "plain")
 */
export function ReportColumn<R, P = R>(reportColumnConfig: ReportColumnConfiguration<R, P, ReportColumnPopulator<any, R> | Array<ReportColumnPopulator<any, R>>>) {
  return (classProto: any, propKey: string) => {
    /* Retrieve the existing metadata defining the class' defined column metadata */
    const metadata: { [key: string]: ReportColumnConfiguration<any, any> } = Reflect.getMetadata(ReportColumnMetadataKey, classProto) || {};

    /* Set the supplied column metadata against the inbound class prototype */
    metadata[propKey] = {
      ...reportColumnConfig,
      populator: castArray(reportColumnConfig.populator),
    };
    Reflect.defineMetadata(ReportColumnMetadataKey, metadata, classProto);
  }
}

/**
 * Internal class which is instantiated via ReportAggregatorService for a given ReportAggregateFormat.
 * T = Report Type
 */
class ReportAggregator<T> {
  constructor(
    private readonly aggregatorType: Type<T>,
    private readonly columnMetadata: ReportColumnMetadata<Array<SimpleReportColumnPopulator<any, any>>>,
    private readonly params?: any
  ) {

  }

  /**
   * Produces a report row resulting from the population processes described on the linked ReportAggregateFormat
   * subtype.  The resulting instance will be an instance of the aforementioned subtype.
   */
  populate(...entities: any[]): T {
    const result: T = Object.create(this.aggregatorType);

    entities.forEach(entity => {
      /* Resolve the type of the populating entity. */
      const type = Object.getPrototypeOf(entity).constructor;

      /* Find all column populators defined to operate against the identified type. */
      Object.keys(this.columnMetadata).forEach(columnMetadataKey => {
        const populator = this.columnMetadata[columnMetadataKey].populator.find(populator =>
          typeof populator.entity === 'object' ? populator.entity.isType(entity) :
            populator.entity === type
        );

        /* Execute the populator, and assign the result to the column indicated by the current metadata key. */
        result[columnMetadataKey] = populator ? populator.populate(entity, this.params) : result[columnMetadataKey];
      });
    });

    /* Return the resulting row. */
    return result;
  }

  /**
   * Exports the current representation of the report row described by this object into a plain report-friendly format.
   */
  public export(row: T) {
    /* Output this object to a plain result */
    const result = {};

    /* Scan through the column metadata, and execute any export functions that may be defined (or use the existing
     * value if no export function exists...) */
    Object.keys(this.columnMetadata).forEach(metadataKey => {
      result[metadataKey] = this.columnMetadata[metadataKey].export ?
        this.columnMetadata[metadataKey].export(row[metadataKey]) : row[metadataKey];
    });

    return result;
  }
}

type ReportFormatters<T> = { [key in keyof T]: { columnTitle: string, formatter: (value: any) => any } };

/**
 * Service to assist with the manipulation of report aggregation.
 */
@Injectable()
export class ReportAggregatorService {
  constructor(private readonly moduleRef: ModuleRef) { }

  /**
   * Creates a new report aggregator for the supplied ReportAggregateFormat subtype.
   */
  createReportAggregator<T, P>(type: Type<T>, params?: P) {
    /* Retrieve the metadata defined by the supplied aggregator type */
    const columnMetadata: ReportColumnMetadata = Reflect.getMetadata(ReportColumnMetadataKey, type.prototype);

    /* If no metadata is defined, throw an exception. */
    if (!columnMetadata) {
      throw new Error(`Cannot build report aggregator - no column metadata is defined for this object!`);
    }

    /* Format the retrieved metadata into a column metadata set containing only SimpleReportColumnPopulators */
    const simpleColumnMetadata: ReportColumnMetadata<Array<SimpleReportColumnPopulator<any, any>>> = Object.keys(columnMetadata)
      .reduce((collector: ReportColumnMetadata<Array<SimpleReportColumnPopulator<any, any>>>, key) => {

        const populators: Array<SimpleReportColumnPopulator<any, any>> = columnMetadata[key].populator.map(populator => {
          let populatorFunc = populator.populate;

          /* If this column metadata entry defines an injectable populator, we will need to collect and inject dependnecies
           * now. */
          if (typeof populatorFunc !== 'function') {
            const deps = populatorFunc.dependencies.map(dep => this.moduleRef.get(dep, { strict: false }));
            populatorFunc = populatorFunc.factory(...deps);
          }

          /* Return the resulting populator */
          return {
            entity: populator.entity,
            populate: populatorFunc,
          };
        });

        collector[key] = {
          ...collector[key],
          populator: populators,
        };

        return collector;
    }, {});

    return new ReportAggregator(type, simpleColumnMetadata, params);
  }

  /**
   * Returns a CsvFileService-friendly version of the report format defined by the supplied ReportAggregateFormat
   * subtype (bridging logic in place until the new report format system supercedes the old system).
   */
  getReportFormatters<T>(aggregateType: Type<T>): ReportFormatters<T> {
    /* Retrieve the metadata for the supplied aggregate type */
    const metadata: ReportColumnMetadata = Reflect.getMetadata(ReportColumnMetadataKey, aggregateType.prototype);

    /* Transform each value in the retrieved metadata into a report file output processor.
     * This is bridging logic for now until the new reporting system supercedes the old reporting system. */
    return Object.keys(metadata).reduce((collector, metadataKey) => {
      collector[metadataKey] = { columnTitle: metadata[metadataKey].header, formatter: metadata[metadataKey].export };
      return collector;
    }, {} as ReportFormatters<T>);
  }
}
