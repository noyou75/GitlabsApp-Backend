import { FindConditions, Repository } from 'typeorm';
import { secureid, SecureIdAlphabets } from '../../../common/string.utils';

export const generateUniqueEntityId = async <E>(
  length: number,
  repository: Repository<E>,
  alphabet = SecureIdAlphabets.Standard,
  getUniqueConditions: (secureId: string) => FindConditions<E>,
  skipUniqueVerification?: boolean
): Promise<string> => {
  const code = secureid(length, alphabet);
  return !skipUniqueVerification && (await repository.count(getUniqueConditions(code))) > 0
    ? await generateUniqueEntityId(length, repository, alphabet, getUniqueConditions)
    : code;
};
