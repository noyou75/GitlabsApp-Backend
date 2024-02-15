import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsMilitaryTime, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { isFuture } from 'date-fns';
import { IsDateAfter } from '../../modules/shared/constraints/is-date-after.constraint';
import { IsDateBefore } from '../../modules/shared/constraints/is-date-before.constraint';
import { IsMilitaryTimeAfter } from '../../modules/shared/constraints/is-military-time-after.constraint';
import { IsMilitaryTimeBefore } from '../../modules/shared/constraints/is-military-time-before.constraint';
import { SimpleDateTime } from './simple-date-time.embed';

@Exclude()
export class ScheduleDay {
  @IsOptional()
  @IsBoolean()
  @Expose()
  disabled: boolean = false;

  @Type(() => OperatingHours)
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Expose()
  hours?: OperatingHours[];
}

@Exclude()
export class OperatingHours {
  @IsOptional()
  @IsMilitaryTime({ message: '$property must be a valid military time' })
  @IsMilitaryTimeBefore('end')
  @Expose()
  start: string;

  @ValidateIf((o) => o.start || o.end)
  @IsMilitaryTime({ message: '$property must be a valid military time' })
  @IsMilitaryTimeAfter('start')
  @Expose()
  end: string;
}

@Exclude()
export class BlackoutPeriod {
  @Type(() => SimpleDateTime)
  @ValidateNested()
  @IsDateBefore('end')
  @Expose()
  start: SimpleDateTime;

  @Type(() => SimpleDateTime)
  @ValidateNested()
  @IsDateAfter('start')
  @Expose()
  end: SimpleDateTime;
}

@Exclude()
export class ScheduleEmbed {
  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  monday?: ScheduleDay;

  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  tuesday?: ScheduleDay;

  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  wednesday?: ScheduleDay;

  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  thursday?: ScheduleDay;

  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  friday?: ScheduleDay;

  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  saturday?: ScheduleDay;

  @Type(() => ScheduleDay)
  @ValidateNested()
  @IsOptional()
  @Expose()
  sunday?: ScheduleDay;

  @Type(() => BlackoutPeriod)
  // TODO this logic needs to be updated to accommodate the time zone neutral nature of blackout windows
  //  Blackout periods are defined without timezone data, which means that they describe relative
  //  time bounds applicable directly to the consuming context without time zone conversion.  They are
  //  meant represent the indicated time as the exact local time in a given location.
  //  At the moment, it is not possible for us to determine the local time zone of the consuming context
  //  in the context of this transformer, which means it is not possible to convert the blackout window's
  //  defined time to a reliable UTC value.
  @Transform((blackouts) => (Array.isArray(blackouts) ? blackouts.filter((blackout) => isFuture(blackout.end.toDate())) : blackouts), {
    toPlainOnly: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Expose()
  blackouts?: BlackoutPeriod[];
}

@Exclude()
export class SpecialistScheduleEmbed extends ScheduleEmbed {
  @IsOptional()
  @IsBoolean()
  @Expose()
  exposeHours?: boolean = false;
}
