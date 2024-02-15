import { SetMetadata, Type } from '@nestjs/common';
import { LabCompany } from '../../../common/enums/lab-company.enum';
import { ReferralEmbed } from '../../../entities/embed/referral.embed';

export const ReferrerMetadataKey = 'ReferrerMetadataKey';

/**
 * Used to annotate a class that identifies referrer-specific behaviour.
 */
export const Referrer = (labCompany: LabCompany) => {
  const meta = SetMetadata<string, LabCompany>(ReferrerMetadataKey, labCompany);
  return (type: Type<IReferrer>) => meta(type);
};

/**
 * All classes defining referrer-specific behaviour must implement IReferrer
 */
export interface IReferrer {
  /**
   * Determines whether or not a given referral is active according to the supplied comparison date.
   */
  isActive(referralEmbed: ReferralEmbed, comparisonDate?: Date): boolean;
}
