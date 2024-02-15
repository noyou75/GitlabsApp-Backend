import {format} from 'date-fns-tz';

export const booleanToYesNo = val => val ? 'Yes' : 'No';

export const formatDateTime = (val: Date) => val ? format(val, 'yyyy-MM-dd HH:mm:ss') : '';
