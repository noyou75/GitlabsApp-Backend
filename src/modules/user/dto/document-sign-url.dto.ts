import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DocumentSignUrlDto {
  @Expose()
  signUrl: string;

  @Expose()
  expiresAt: Date;
}
