import { SetMetadata, Type } from '@nestjs/common';
import { SECURITY_VOTER_METADATA } from '../services/security-voter.service';

export interface SecurityVoterOptions {
  type: Type<any>;
  attrs?: string[];
}

export const SecurityVoter = (type: Type<any>, attrs?: string[]) =>
  SetMetadata(SECURITY_VOTER_METADATA, { type, attrs } as SecurityVoterOptions);
