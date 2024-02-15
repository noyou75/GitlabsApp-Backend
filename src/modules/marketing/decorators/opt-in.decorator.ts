import { SetMetadata, Type } from '@nestjs/common';
import { PatientUser } from '../../../entities/user.entity';
import { OptInType } from '../dto/opt-in.dto';

export const OptInMetadataKey = 'OptInKey';

export const OptIn = (optInType: OptInType) => {
  return SetMetadata(OptInMetadataKey, optInType);
};

export enum OptInFailureReasons {
  IS_ALREADY_OPTED_IN = 'IS_ALREADY_OPTED_IN',
}

export interface OptInResult {
  optIn: boolean;
  reasons: OptInFailureReasons[];
}

export interface OptInHandler {
  optIn(user: PatientUser): Promise<OptInResult>;
}
