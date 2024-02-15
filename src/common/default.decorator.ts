import { Transform } from 'class-transformer';

export function Default(defaultValue: any) {
  return Transform((value: any) => value || defaultValue);
}
