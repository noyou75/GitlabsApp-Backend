import { getRepository } from 'typeorm';
import { SecureIdAlphabets } from '../../../common/string.utils';
import { PatientUser } from '../../../entities/user.entity';
import { generateUniqueEntityId } from '../../shared/util/entity.util';

/**
 * Generates a short 7 character unique referral identifier for PatientUsers.
 */
export const generateReferralCode = async (skipUniqueVerification?: boolean): Promise<string> => {
  return generateUniqueEntityId(7, getRepository(PatientUser), SecureIdAlphabets.Conservative, referralCode => {
      return { referralCode };
  }, skipUniqueVerification);
};
