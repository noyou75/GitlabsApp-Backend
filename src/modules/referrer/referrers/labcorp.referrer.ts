import { differenceInHours } from 'date-fns';
import { LabCompany } from '../../../common/enums/lab-company.enum';
import { ReferralData, ReferralEmbed } from '../../../entities/embed/referral.embed';
import { IReferrer, Referrer } from '../decorators/referrer.decorator';

/**
 * Referrer-specific behaviours for Labcorp
 */
@Referrer(LabCompany.Labcorp)
export class LabcorpReferrer implements IReferrer {
  isActive(referralEmbed: ReferralEmbed<ReferralData>, comparisonDate = new Date()): boolean {
    return referralEmbed?.data?.referrer === LabCompany.Labcorp && differenceInHours(referralEmbed.referralDate, comparisonDate) < 72;
  }
}
