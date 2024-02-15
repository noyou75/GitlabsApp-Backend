import { User } from '../../../entities/user.entity';

export class ReferralCodeGenerationError extends Error {
  constructor(user: User, details: string) {
    super(`Cannot generate referral code for user ${ user.id }: ${ details }`);
  }
}
