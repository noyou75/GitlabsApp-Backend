import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { AwardConditionsEnum } from '../common/enums/award-conditions.enum';
import { AwardTriggersEnum } from '../common/enums/award-triggers.enum';
import { AwardType } from '../common/enums/award-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { IsUnique } from '../modules/shared/constraints/is-unique.constraint';

@Exclude()
@Entity({
  name: 'award_campaign',
})
export class AwardCampaignEntity {
  @Column()
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({
    default: 'Default',
  })
  @IsString()
  @IsNotEmpty()
  @IsUnique()
  @Expose()
  public name: string;

  @Column()
  @IsNumber()
  @IsPositive()
  @Expose()
  public award: number;

  @Column()
  @IsBoolean()
  @Expose({ groups: [UserRole.Staff] })
  public isActive: boolean;

  @Column({ type: 'enum', enum: AwardType })
  @IsIn(enumValues(AwardType))
  @Expose()
  public awardType: AwardType;

  @Column({
    type: 'enum',
    enum: AwardConditionsEnum,
    array: true,
    nullable: true,
  })
  @IsIn(enumValues(AwardConditionsEnum))
  @Expose({ groups: [UserRole.Staff] })
  public awardConditions: AwardConditionsEnum[];

  @Column({
    type: 'enum',
    enum: AwardTriggersEnum,
  })
  @IsIn(enumValues(AwardTriggersEnum), { each: true })
  @Expose({ groups: [UserRole.Staff] })
  public trigger: AwardTriggersEnum;

  @Column({ default: false })
  @IsBoolean()
  @Expose({ groups: [UserRole.Staff] })
  public isDefault: boolean;
}
