/**
 * Represents some Type of Class.
 */
// export interface ClassType<T> {
//   new (...args: any[]): T;
// }
export type ClassType<T> = (new (...args: any[]) => T) | Function;

export const className = (type: ClassType<any> | string | any): string => {
  if (typeof type === 'string') {
    return type;
  }

  if (typeof type === 'object') {
    return Object.getPrototypeOf(type).constructor.name;
  }

  return type.name;
};
