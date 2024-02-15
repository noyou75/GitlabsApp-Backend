import { Exclude, Expose, Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { Column } from 'typeorm';
import { LabCompany } from '../../common/enums/lab-company.enum';

export enum ReferrerType {
  SearchEngine = 'SEARCH_ENGINE',
  Direct = 'DIRECT',
  Partner = 'PARTNER',
  MarketingCampaign = 'MARKETING_CAMPAIGN',
  Refresh = 'REFRESH',
  InterAppTraversal = 'INTER_APP_TRAVERSAL',
  Peer = 'PEER',
  Other = 'OTHER',
}

export interface ReferralData {
  referrer?: LabCompany;
  [key: string]: any;
}

export interface PeerReferralData extends ReferralData {
  referralLink: string;
}

/**
 * Describes the method by which a given user initially (or rather, most significantly) arrived to Getlabs.
 */
@Exclude()
export class ReferralEmbed<T extends ReferralData = ReferralData> {
  /* Note: when we expand referrals to non-partner cases, we will need to remove this property (in favour of the 'referrer' property in
   * the ReferralData interface above. */
  @Column({ nullable: true, type: 'enum', enum: LabCompany })
  @IsOptional()
  @Expose()
  public partner: LabCompany;

  @Column({ nullable: false })
  @Expose()
  public analyticsTokens: string[];

  @Column({ nullable: false })
  @Type(() => Date)
  @Expose()
  public referralDate: Date;

  @Column({ nullable: true })
  @Expose()
  public referralMethod: ReferrerType;

  @Column({ nullable: true })
  @Expose()
  public data: T;
}
