import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AsyncParser } from 'json2csv';
import { Readable, Writable } from 'stream';
import { ConfigService } from '../../core/services/config.service';
import { StorageService } from '../../core/services/storage.service';
import { ReportAggregatorService } from '../format/report-aggregator.service';

/**
 * Defines the shape of a given column definition.
 */
export interface CsvColumnProperties<T> {
  columnTitle: string;
  formatter?: (value: any | undefined, key: string, reportRow: T) => any;
}

/**
 * Defines the shape of a given report format definition object.
 */
export interface IReportFormat<T, S = any> {
  getFormat(...args: any[]): { [key in keyof T]: CsvColumnProperties<S> };
}

const getMetadataKey = (reportKey: string) => `ReportFormat:${reportKey}`;

/**
 * Decorator that identifies a CSV file format.
 */
export function ReportFormat(reportKey: string) {
  return (target: Type<IReportFormat<any>>) => {
    /* Set metadata against the CsvFileService class, which will be queried inside of said class to retrieve defined formats... */
    Reflect.defineMetadata(getMetadataKey(reportKey), target, CsvFileService);
  };
}

/**
 * Decorator that identifies a CSV file format class' getFormat interface.
 */
export function GetFormat() {
  /* Deliberately empty, and with deliberately unused parameters.  TS will not emit metadata for any properties that are not
   * decorated, thus we need this decorator to resolve deps for IReportFormat#getFormat.  Params are necessary because the compiler
   * complains if a method is decorated with a decorator without these params... */
  return (target, method, desc) => {};
}

/**
 * Defines the shape of the control object we will use to manipulate/monitor the file input stream.
 */
export interface CsvStream {
  getComplete$: () => Promise<string>;
  inputStream: Readable;
}

/**
 * Generic service that manages the creation of CSV parsers that can stream output to a file in a GCP storage bucket.
 */
@Injectable()
export class CsvFileService {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly reportAggregatorService: ReportAggregatorService,
  ) {}

  /**
   * Creates a parser for the supplied format key (i.e. format key must correspond to a format registered via the ReportFormat decorator /
   * IReportFormat interface
   */
  public getCsvFormatter<T>(
    formatKeyOrAggregateFormat: string | Type<any>,
    writable: Writable,
    params?: { [key: string]: any },
    // format: {[key in keyof ReportRow]?: CsvColumnProperties}
  ): CsvStream {
    /* Type narrowing */
    const formatKey = typeof formatKeyOrAggregateFormat === 'string' ? formatKeyOrAggregateFormat : null;
    const aggregateFormat = typeof formatKeyOrAggregateFormat !== 'string' ? formatKeyOrAggregateFormat : null;

    /* Resolve the format from the supplied key... */
    let format: { [key: string]: CsvColumnProperties<T> };

    /* Bridging logic that handles the old method for specifying format types - to be removed once the new method fully supercedes
     * the old method. */
    if (formatKey) {
      const reportFormatType: Type<IReportFormat<T>> = Reflect.getMetadata(getMetadataKey(formatKey), CsvFileService);

      /* If the format does not exist, throw an exception */
      if (!reportFormatType) {
        throw new Error(`Cannot instantiate CsvParser - the supplied formatKey (${formatKey}) does not exist!`);
      }

      /* Instantiate the format resolver and invoke it's getFormat method... */
      const reportFormat = new reportFormatType(params);

      /* Resolve the types for each of the function parameters of getFormat & inject! */
      // const pt = Reflect.getPrototypeOf(reportFormat);

      const depsTypes = Reflect.getMetadata('design:paramtypes', reportFormatType.prototype, reportFormat.getFormat.name);
      const deps = depsTypes.map(dep => {
        // Assuming no injection decorator for the moment...
        return this.moduleRef.get(dep, { strict: false });
      });

      format = reportFormat.getFormat(...deps);
    } else {
      /* If we're dealing with a ReportAggregateFormat object, we'll need to retrieve the metadata of the keys associated with this
       * format, then generate an according format object from the metadata */
      format = this.reportAggregatorService.getReportFormatters(aggregateFormat)
    }

    const asyncParser: AsyncParser<any> = new AsyncParser<any>(
      {
        fields: Object.keys(format).map(csvFormatKey => {
          return {
            value: format[csvFormatKey].formatter
              ? (rr: T) => format[csvFormatKey].formatter(rr[csvFormatKey], csvFormatKey, rr)
              : csvFormatKey,
            label: format[csvFormatKey].columnTitle,
          };
        }),
      },
      { objectMode: true },
    );

    const inputStream = new Readable({ objectMode: true });

    inputStream._read = () => {};
    const operatingParser = asyncParser.fromInput(inputStream).toOutput(writable);

    return {
      getComplete$: () => operatingParser.promise(),
      inputStream,
    };
  }
}
