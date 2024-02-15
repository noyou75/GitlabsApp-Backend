import { getRepository } from 'typeorm/index';
import { secureid } from '../../common/string.utils';
import { AppointmentEntity } from '../../entities/appointment.entity';

/**
 * Generates a short 6 character unique identifier for an appointment.
 */
export const generateIdentifier = async (skipUniqueVerification?: boolean): Promise<string> => {
  const identifier = secureid(6, '23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
  return !skipUniqueVerification && (await getRepository(AppointmentEntity).count({ identifier })) > 0
    ? await generateIdentifier()
    : identifier;
};
