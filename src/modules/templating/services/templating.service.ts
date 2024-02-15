import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as DateFns from 'date-fns';
import { format as formatDate } from 'date-fns';
import { format as formatDateTz, utcToZonedTime } from 'date-fns-tz';
import Handlebars from 'handlebars';
import Layouts from 'handlebars-layouts';
import { parsePhoneNumber } from 'libphonenumber-js/max';
import { className } from '../../../common/class.utils';
import { DiscountType } from '../../../common/enums/discount-type.enum';
import { UserGender } from '../../../common/enums/user-gender.enum';
import { loadFile } from '../../../common/file.utils';
import { CouponEntity } from '../../../entities/coupon.entity';
import { PatientUser, User } from '../../../entities/user.entity';
import { BasicConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { Template } from '../template';

@Injectable()
export class TemplatingService {
  private templates = new Map<Type<Template>, Template>();

  constructor(private readonly moduleRef: ModuleRef, private readonly config: ConfigService, private readonly logger: LoggerService) {
    // Register some helpers for handlebars, this should be made more generic
    Handlebars.registerHelper(Layouts(Handlebars));
    Handlebars.registerHelper('equals', function(string1, string2, options) {
      if (string1 === string2) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });
    Handlebars.registerHelper('static-url', (url: string) => `https://static.${config.get(BasicConfig.Domain)}/${url}`);
    Handlebars.registerHelper('absolute-url', (path: string, options: Handlebars.HelperOptions) => {
      // Replace :key style identifiers with values from options hash
      path = path
        .split('/')
        .map(part => {
          const key = part.match(/:(.+)/);
          return key && key[1] in options.hash ? options.hash[key[1]] : part;
        })
        .join('/');
      return `https://app.${config.get(BasicConfig.Domain)}/${path}`;
    });
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    Handlebars.registerHelper('length', (arr: any[]) => arr.length);
    Handlebars.registerHelper('split', (str: string, char: string = '') => str.split(char));
    Handlebars.registerHelper('splice', (str: string, partLength: number, delimiter: string) =>
      str.match(new RegExp(`.{1,${partLength}}`, 'g')).join(delimiter),
    );
    Handlebars.registerHelper('date', (date: Date) => formatDate(date, 'P'));
    Handlebars.registerHelper('format-date', (date: Date, format: string, tz?: string) => {
      /* If date is not supplied, create set a date reflecting the current date/time */
      date = date || new Date();
      return formatDateTz(typeof tz === 'string' ? utcToZonedTime(date, tz) : date, format, {
        timeZone: typeof tz === 'string' ? tz : undefined,
      });
    });
    Handlebars.registerHelper('format-date-time-range', (startAt: Date, endAt: Date, tz?: string) => {
      const options = {
        timeZone: undefined,
      };
      let now = new Date();
      if (tz) {
        startAt = utcToZonedTime(startAt, tz);
        endAt = utcToZonedTime(endAt, tz);
        now = utcToZonedTime(now, tz);
        options.timeZone = tz;
      }
      const day = formatDateTz(startAt, 'EEE, MMM d', options);
      const startTime = formatDateTz(startAt, 'ha', options).toLowerCase();
      const endTime = formatDateTz(endAt, 'ha', options).toLowerCase();
      let prefix = '';
      if (DateFns.isSameDay(now, startAt)) {
        prefix = 'today at';
      } else if (DateFns.isSameDay(DateFns.addDays(now, 1), startAt)) {
        prefix = 'tomorrow at';
      }
      return `${prefix} ${startTime} to ${endTime} on ${day}`.trim();
    });
    Handlebars.registerHelper('phone', (phone: string) => parsePhoneNumber(phone, 'US').formatNational());
    Handlebars.registerHelper('hasInsurance', (user: PatientUser) => (user.insurance.hasInsurance() ? 'Yes' : 'No'));
    Handlebars.registerHelper('gender', (user: User) => {
      switch (user.gender) {
        case UserGender.Male:
          return 'Male';
        case UserGender.Female:
          return 'Female';
        case UserGender.Other:
        default:
          return 'Other';
      }
    });
    Handlebars.registerHelper('math', (lVal, operator, rVal) => {
      lVal = parseFloat(lVal);
      rVal = parseFloat(rVal);

      return {
        '+': lVal + rVal,
        '-': lVal - rVal,
        '*': lVal * rVal,
        '/': lVal / rVal,
        '%': lVal % rVal,
      }[operator];
    });
    Handlebars.registerHelper('withinHours', function(date: Date | string, amount = 0, inverse = false, options: any) {
      /* If the date is a string, attempt to convert it to a date */
      date = date instanceof Date ? date : DateFns.parseISO(date);

      /* Calculate the date that results from subtracting the supplied measure from now.  If that date comes before the current date,
       * then we are dealing with a date where today is within range. */
      const now = new Date();
      const compDate = DateFns.subHours(date, amount);

      if (inverse ? DateFns.isAfter(compDate, now) : DateFns.isBefore(compDate, now)) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });
    Handlebars.registerHelper('ifHasInsurance', function(user: PatientUser, options: any) {
      return user.insurance.hasInsurance() ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('charAt', function(val: string, charAt: number) {
      return val && typeof val === 'string' ? val.charAt(charAt) : '';
    });

    /* Determines if the supplied value is within the supplied collection. */
    Handlebars.registerHelper('isIn', function(collection: Array<any>, val: any, options: any) {
      return collection.indexOf(val) > -1 ? options.fn(this) : options.inverse(this);
    });

    /* Assumes an inbound string of at least 2 digits, where the last 2 digits signify cents. */
    Handlebars.registerHelper('discount', function(coupon: CouponEntity) {
      switch (coupon.discountType) {
        case DiscountType.Absolute:
          return `${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coupon.discount / 100)}`;
        case DiscountType.Percentage:
          return `${coupon.discount}%`;
        default:
          return '--';
      }
    });

    /* Implements less than / greater than operators (equals operator is already implemented above) */
    Handlebars.registerHelper('comparator', function(lVal, operator, rVal) {
      lVal = parseFloat(lVal);
      rVal = parseFloat(rVal);

      return {
        '>': lVal > rVal,
        '<': lVal < rVal,
        '===': lVal === rVal,
      }[operator];
    });

    /* Cycle through the provided arguments, and return the first available value. */
    Handlebars.registerHelper('getFirst', (...args) => args.slice(0, args.length && args.length - 1).find(Boolean));

    /* Implements a simple "if true then use this value" condition (i.e. returns the supplied returnValue if value is truthy) */
    Handlebars.registerHelper('ifThen', (value, returnValue) => !!(value && (!Array.isArray(value) || value.length)) && returnValue);

    Handlebars.registerHelper('truncateNumber', (value: string | number) => {
      return Number(value).toFixed(0);
    });

    /* Applies currency formatting to the inbound number. */
    Handlebars.registerHelper('currency', (value: string | number) => {
      const valueNum = Number(value);

      /* If the supplied value does not evaluate to a number, we will need to throw an exception so that issues are easy to debug. */
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Templating - currency - Cannot parse input value '${ value }' into a number.`);
      }

      return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valueNum);
    });

    Handlebars.registerPartial('email-layout', loadFile('views/notifications/email-layout.hbs'));
    Handlebars.registerPartial('email-button', loadFile('views/notifications/email-button.hbs'));
    Handlebars.registerPartial('email-highlight-message', loadFile('views/notifications/email-highlight-message.hbs'));
    Handlebars.registerPartial('email-table-props', 'width="280" height="60"');
    Handlebars.registerPartial('email-external-disclaimer', loadFile('views/notifications/email-external-disclaimer.hbs'));
  }

  async render(type: Type<Template>, params?: { [k: string]: any }): Promise<string> {
    if (!this.templates.has(type)) {
      this.logger.info(`Template '${className(type)}' not in cache, loading it...`);
      try {
        // Assume the template is a service and try to get it from the container
        this.templates.set(type, this.moduleRef.get(type, { strict: false }));
      } catch (e) {
        // Instantiate it directly if the template doesn't exist as a service
        this.logger.info(`Template '${className(type)}' is not a service, instantiating it directly`);
        this.templates.set(type, new type());
      }
    }

    return this.templates.get(type).render(params);
  }
}
