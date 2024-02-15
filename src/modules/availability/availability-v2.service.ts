import { AvailabilityParameters, getAvailabilities, getEarliestAvailabilityForMinimumNotice } from '@app/scheduler';
import { DateInterval, TimeInterval } from '@app/scheduler/interval';
import { Timeslot } from '@app/scheduler/timeslot';
import { Day, daysOfTheWeek, Schedule, WeeklyTimetable } from '@app/scheduler/timetable';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { addDays, eachDayOfInterval, endOfDay, endOfHour, format, isAfter, setHours, startOfDay, startOfHour } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { getRepository } from 'typeorm';
import { AppointmentBookingTypes } from '../../common/enums/appointment-booking-types.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { BlackoutPeriod, ScheduleEmbed } from '../../entities/embed/schedule.embed';
import { MarketEntity } from '../../entities/market.entity';
import { ServiceAreaEntity } from '../../entities/service-area.entity';
import { SpecialistUser } from '../../entities/user.entity';
import { PatientBookingHours } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { HolidayService } from '../core/services/holiday.service';
import { LoggerService } from '../core/services/logger.service';
import { ServiceAreaService } from '../locale/service-area/service-area.service';
import { OperatingHoursService } from '../shared/services/operating-hours.service';
import { StringEncoderService } from '../shared/services/string-encoder.service';
import { SimpleTimeRange } from '../shared/util/time.util';
import { AvailabilityDescriptor, AvailabilityMetadataKey } from './availability.decorator';
import { BookingKey } from './dto/booking-key';
import { DaySlotsDto } from './dto/day-slots.dto';
import { TimeslotDto } from './dto/timeslot.dto';

export interface AvailabilityQueryOption {
  from?: Date;
  ignoreBookingRestrictions?: boolean;
  specialist?: SpecialistUser;
  appointment?: AppointmentEntity;
}

interface AvailabilityData {
  serviceable: true;
  timeslots: DaySlotsDto[];
  tz: string;
}

interface UnserviceableAvailabilityData {
  serviceable: false;
}

type AvailabilityTypes = Partial<Record<AppointmentBookingTypes, AvailabilityDescriptor>>;

@Injectable()
export class AvailabilityV2Service implements OnModuleInit {
  private availabilityTypes: AvailabilityTypes;

  constructor(
    private readonly config: ConfigService,
    private readonly serviceAreas: ServiceAreaService,
    private readonly operatingHours: OperatingHoursService,
    private readonly holidays: HolidayService,
    private readonly encoder: StringEncoderService,
    private readonly discovery: DiscoveryService,
    private readonly loggerService: LoggerService,
  ) {}

  async onModuleInit() {
    // /* Discover the set of providers that have been registered with the @Availability decorator */
    this.availabilityTypes = (await this.discovery.providersWithMetaAtKey<string>(AvailabilityMetadataKey)).reduce(
      (collector: AvailabilityTypes, provider) => {
        if (!(provider.discoveredClass.instance instanceof AvailabilityDescriptor)) {
          throw new Error(`${provider.discoveredClass.name} must be an instance of AvailabilityDescriptor!`);
        }

        collector[provider.meta] = provider.discoveredClass.instance;
        return collector;
      },
      {},
    );
  }

  getNow(): Date {
    // Shortcut to getting the current time in UTC, enables easy testing by adjusting the current time if needed
    // return zonedTimeToUtc(parseISO('2021-02-11T10:00:01'), 'America/Phoenix');
    return new Date();
  }

  async getTimeslots(
    type: AppointmentBookingTypes,
    zip: string,
    days: number,
    options: AvailabilityQueryOption = { from: this.getNow() },
  ): Promise<AvailabilityData | UnserviceableAvailabilityData> {
    const bookingHours = options.ignoreBookingRestrictions
      ? this.operatingHours.getBusinessHours()
      : this.operatingHours.getPatientBookingHours();

    const serviceArea = await this.serviceAreas.getByZipCode(zip);

    if (!serviceArea || !serviceArea.active || !serviceArea.market.isActive) {
      return {
        serviceable: false,
      };
    }

    const tz = serviceArea.timezone;

    // These start and end dates are considered to be in local time
    const start = startOfDay(options.from);
    const end = endOfDay(addDays(options.from, days));

    const specialists = options.specialist
      ? [options.specialist]
      : await this.getSpecialists(serviceArea.market, options.ignoreBookingRestrictions);

    const businessHours = this.getBusinessHours(serviceArea.market, bookingHours);
    const schedules = await this.getSchedules(specialists, businessHours);
    const holidays = this.getHolidays(start, end, serviceArea.market);
    const initialBlackout = await this.getInitialBlackout(start, businessHours, holidays, tz);

    // The date range here is presented as 00:00:00 to 23:59:59 UTC, but we're actually interested in the appointments
    // occurring during that date range in their local timezone, so convert the UTC dates to their local equivalent.
    const allocations = await this.getAllocations(
      serviceArea.market,
      zonedTimeToUtc(start, tz),
      zonedTimeToUtc(end, tz),
      tz,
      options.specialist,
    );

    // TODO: This service needs unit tests in a bad way... =/

    const params: AvailabilityParameters = {
      start,
      end,
      duration: 60,
      schedules,
      // Clamp the blackout period due to a weird business rule where the blackout for the next day only takes effect after a certain time
      blackouts: options.ignoreBookingRestrictions || !initialBlackout ? [] : [this.clampBlackout(initialBlackout, tz)],
      allocations,
      businessHours,
      holidays,
    };

    // console.log(inspect(params, { depth: null }));

    const availabilities = await getAvailabilities(params);

    const priorityCutoff = await this.getPriorityCutoff([...holidays, initialBlackout].filter(Boolean), tz);

    const isPriorityTimeslot = (timeslot: Timeslot, cutoff: Date): boolean => {
      return isAfter(cutoff, timeslot.start);
    };

    const isPriorityEligible: boolean = options.appointment
      ? !!options.appointment?.labOrderDetails.every((d) => d.labOrderFiles?.length > 0)
      : true;

    const timeslots = availabilities
      .map((slot) => ({
        ...slot,
        start: zonedTimeToUtc(slot.start, tz),
        end: zonedTimeToUtc(slot.end, tz),
      }))
      .map((slot) =>
        this.createTimeSlot(
          undefined,
          serviceArea,
          slot.start,
          type,
          options,
          slot.available === 0,
          priorityCutoff && isPriorityTimeslot(slot, zonedTimeToUtc(priorityCutoff, tz)),
        ),
      )
      .map((timeslot) => ({
        ...timeslot,

        // When rebooking, we need to strip priority slots if an appointment is not eligible for a priority slot (no lab order uploaded)
        key: timeslot.priority && !isPriorityEligible ? null : timeslot.key,
      }));

    return {
      serviceable: true,
      timeslots: this.convertToV1Response(timeslots, days, options),
      tz,
    };
  }

  async getSpecialists(market: MarketEntity, ignoreBookingRestrictions?: boolean): Promise<SpecialistUser[]> {
    const specialists = await getRepository(SpecialistUser)
      .createQueryBuilder('u')
      .innerJoin('u.markets', 'm')
      .where('m.id = :id', { id: market.id })
      .getMany();

    return specialists.filter((specialist) => {
      return specialist.isBookable() && (specialist.isAvailable() || ignoreBookingRestrictions);
    });
  }

  private async getSchedules(specialists: SpecialistUser[], defaultTimetable: WeeklyTimetable): Promise<(Schedule & WeeklyTimetable)[]> {
    return specialists.map((specialist): Schedule & WeeklyTimetable => {
      const blackouts = this.convertBlackoutsToDates(specialist.schedule?.blackouts, specialist);

      const timetable: Schedule & WeeklyTimetable = {
        blackouts,
        availabilities: [],
      };

      daysOfTheWeek.forEach((day) => {
        timetable[day] = this.convertScheduleToTimetable(day, specialist.schedule, defaultTimetable);
      });

      return timetable;
    });
  }

  private convertScheduleToTimetable(day: Day, schedule: ScheduleEmbed, defaultTimetable?: WeeklyTimetable): TimeInterval[] {
    if (!schedule) {
      return (defaultTimetable && defaultTimetable[day]) ?? [];
    }

    if (schedule[day]?.disabled === true) {
      return [];
    }

    if (schedule[day]?.hours && schedule[day].hours.length > 0) {
      return schedule[day].hours.map((hour) => ({ from: hour.start, to: hour.end }));
    }

    return (defaultTimetable && defaultTimetable[day]) ?? [];
  }

  private async getAllocations(
    market: MarketEntity,
    start: Date,
    end: Date,
    tz: string,
    specialist?: SpecialistUser,
  ): Promise<DateInterval[]> {
    const query = getRepository(AppointmentEntity)
      .createQueryBuilder('a')
      .select(['a.startAt', 'a.endAt'])
      .innerJoin('a.patient', 'p')
      .innerJoin('p.address.serviceArea', 'sa')
      .innerJoin('sa.market', 'm')
      .where('a.status != :status AND a.startAt >= :start AND a.endAt <= :end AND m.id = :market', {
        status: AppointmentStatus.Cancelled,
        start: start,
        end: end,
        market: market.id,
      });

    if (specialist) {
      query.innerJoin('a.specialist', 's');
      query.andWhere('s.id = :specialist', { specialist: specialist.id });
    }

    return (await query.getMany()).map((appointment) => ({
      start: utcToZonedTime(appointment.startAt, tz),
      end: utcToZonedTime(appointment.endAt, tz),
    }));
  }

  private async getInitialBlackout(
    start: Date,
    timetable: WeeklyTimetable,
    holidays: DateInterval[],
    tz: string,
  ): Promise<DateInterval | undefined> {
    // TODO: Pull this from market configuration
    const blackoutWindow = this.config.get(PatientBookingHours.PatientBookingHoursBlackoutWindow);

    start = utcToZonedTime(start, tz);

    const now = utcToZonedTime(this.getNow(), tz);

    const end = await getEarliestAvailabilityForMinimumNotice({
      minimumNotice: blackoutWindow * 60,
      start: now,
      schedule: {
        ...timetable,
        blackouts: holidays,
      },
    });

    // If we're unable to calculate an end date for some reason, or if the
    // start date is past the end date, there is no initial blackout.
    if (!end || isAfter(start, end)) {
      return undefined;
    }

    return { start, end };
  }

  private clampBlackout(interval: DateInterval, tz: string): DateInterval {
    const now = utcToZonedTime(this.getNow(), tz);

    const cutoff = startOfHour(setHours(utcToZonedTime(this.getNow(), tz), 18)); // 6:00pm local time

    // If we're before the daily cut off, limit the blackout period to the end of today
    if (now < cutoff && isAfter(interval.end, cutoff)) {
      return { start: interval.start, end: endOfDay(now) };
    }

    return interval;
  }

  private getBusinessHours(market: MarketEntity, defaultHours: SimpleTimeRange): WeeklyTimetable {
    // Create a set of default hours for every day to use as a base
    const weekdays: Day[] = [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday, Day.Friday, Day.Saturday, Day.Sunday];
    const defaultTimetable = weekdays.reduce<WeeklyTimetable>((acc, cur) => {
      acc[cur] = [{ from: defaultHours.start.toMilitaryTime(), to: defaultHours.end.toMilitaryTime() }];
      return acc;
    }, {});

    return daysOfTheWeek.reduce<WeeklyTimetable>((acc, cur) => {
      acc[cur] = this.convertScheduleToTimetable(cur, market.schedule, defaultTimetable) ?? defaultHours[cur] ?? [];
      return acc;
    }, {});
  }

  private getHolidays(from: Date, to: Date, market: MarketEntity): DateInterval[] {
    // Get market wide blackouts
    const blackouts = this.convertBlackoutsToDates(market?.schedule?.blackouts, market);

    const holidays = eachDayOfInterval({ start: from, end: to })
      .filter((day) => this.holidays.isHoliday(day))
      .map((day) => ({
        start: startOfDay(day),
        end: endOfDay(day),
      }));

    return [...blackouts, ...holidays];
  }

  private async getPriorityCutoff(blackouts: DateInterval[], tz: string): Promise<Date | null> {
    // TODO: Pull this from market configuration
    const window = this.config.get(PatientBookingHours.PatientBookingHoursPriorityWindow);

    // Doctor's office hours, 7am-4pm local time mon-fri
    const timetable: WeeklyTimetable = (() => {
      const weekdays: Day[] = [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday, Day.Friday];
      return weekdays.reduce<WeeklyTimetable>((acc, cur) => {
        acc[cur] = [{ from: '07:00', to: '16:00' }];
        return acc;
      }, {});
    })();

    return await getEarliestAvailabilityForMinimumNotice({
      minimumNotice: window * 60,
      start: utcToZonedTime(endOfHour(this.getNow()), tz),
      schedule: {
        ...timetable,
        blackouts,
      },
    });
  }

  private convertToV1Response(slots: TimeslotDto[], days: number, options: AvailabilityQueryOption): DaySlotsDto[] {
    const slotsByDay: { [p: string]: DaySlotsDto } = {};

    // Create empty days
    eachDayOfInterval({ start: options.from, end: addDays(options.from, days) }).forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      slotsByDay[dateKey] = new DaySlotsDto(startOfDay(day), []);
    });

    slots.forEach((slot) => {
      const dateKey = format(slot.start, 'yyyy-MM-dd');

      if (!slotsByDay[dateKey]) {
        slotsByDay[dateKey] = new DaySlotsDto(startOfDay(slot.start), []);
      }

      /* Push the identified slot into the date set. */
      slotsByDay[dateKey].slots.push(slot);
    });

    return Object.values(slotsByDay);
  }

  private convertBlackoutsToDates<T extends { id: string }>(blackouts: BlackoutPeriod[], hostEntity: T): DateInterval[] {
    return (blackouts ?? []).map((b) => {
      let result;

      /* toDate can throw an exception if the data is malformed.  To avoid exceptions causing consuming APIs to fail, we must
       * surround this statement in a try/catch, and simply ignore errant values. */
      try {
        result = {
          start: b.start.toDate(),
          end: b.end.toDate(),
        };
      } catch (err) {
        /* Log an exception, but permit the rest of the schedule resolution method to proceed. */
        this.loggerService.error(
          `Encountered an exception when attempting to resolve blackout data for ` +
            `${Object.getPrototypeOf(hostEntity)?.constructor.name || 'Untyped Entity'} ID ${hostEntity.id}: ${err}`,
        );
      }

      return result;
    });
  }

  private generateBookingKey(resource: string, startAt: Date, endAt: Date, price: number, priority?: boolean): string {
    return this.encoder.encrypt(JSON.stringify(classToPlain(new BookingKey(resource, startAt, endAt, price, priority))));
  }

  private getTypeDescriptor(type: AppointmentBookingTypes): AvailabilityDescriptor {
    /* Find the availability class desc that corresponds to the supplied type. */
    const bookingType = this.availabilityTypes[type];

    if (!bookingType) {
      throw new BadRequestException(`Supplied booking type ${type} does not exist.`);
    }

    return bookingType;
  }

  public createTimeSlot(
    specialist: string | undefined, // Undefined cases happen when this is a "dead" slot
    serviceArea: ServiceAreaEntity,
    start: Date,
    type: AppointmentBookingTypes,
    options: AvailabilityQueryOption,
    booked?: boolean,
    priority?: boolean,
  ): TimeslotDto {
    const description = this.getTypeDescriptor(type).getTimeSlotDescription(serviceArea, start);

    const key =
      !booked || (options.specialist?.id && options.ignoreBookingRestrictions)
        ? this.generateBookingKey(specialist ?? options.specialist?.id, description.startAt, description.endAt, description.price, priority)
        : null;

    return new TimeslotDto(key, description.startAt, description.endAt, description.price, booked, priority);
  }
}
