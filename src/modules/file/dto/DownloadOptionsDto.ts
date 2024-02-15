import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class DownloadOptionsDto {
  @Transform(value => String(value).toLowerCase() === 'true', { toClassOnly: true })
  @Expose()
  inline?: boolean;
}
