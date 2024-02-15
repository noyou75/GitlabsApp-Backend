import { extend } from 'lodash';

export enum FilePurpose {
  Avatar = 'avatar',
  InsuranceFront = 'insurance-front',
  InsuranceRear = 'insurance-rear',
  LabOrder = 'lab-order',
  Thumbnail = 'thumbnail',
  Signature = 'signature',
  AbnDocument = 'abn-document',
  AccuDraw = 'accu-draw',
  AppointmentDeliveryForm = 'appointment-delivery-form',
}

// TODO - ideally, this would be merged with FilePurpose in the context of a class, but we don't have time for that refactoring
export interface FilePurposeConfigDef {
  signedUrlTtl: number;
}

/**
 * Provides file configuration properties based on the file purpose.
 */
export class FilePurposeConfig implements FilePurposeConfigDef {
  public readonly signedUrlTtl: number;

  constructor(config: FilePurposeConfigDef) {
    extend(this, config);
  }

  /**
   * Lab order file type - these files have signed URLs that need to live for a shorter time than other files.
   */
  public static readonly [FilePurpose.LabOrder] = new FilePurposeConfig({ signedUrlTtl: 1000 * 60 * 20 });

  static *[Symbol.iterator]() {
    for (const key of Object.keys(FilePurposeConfig)) {
      if (FilePurposeConfig[key] instanceof FilePurposeConfig) {
        yield FilePurposeConfig[key];
      }
    }
  }

  /**
   * Retrieves the FilePurposeConfig object mapping to the supplied FilePurpose.
   */
  public static getFilePurposeConfig(purpose: FilePurpose) {
    return FilePurposeConfig[purpose];
  }
}
