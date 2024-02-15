import { Exclude, Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { AwardType } from '../../../common/enums/award-type.enum';

@Exclude()
export class AwardTypeDto {
  @IsIn(enumValues(AwardType))
  @Expose()
  awardType: AwardType;
}
