import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PagedResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  total: number;

  constructor(data: T[], totalItems: number) {
    this.data = data;
    this.total = totalItems;
  }
}
