import { Exclude, Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { UserRole } from '../common/enums/user-role.enum';
import { AwardCampaignEntity } from './award-campaign.entity';
import { PatientUser } from './user.entity';

export enum PeerReferralStatus {
  Pending = 'Pending',
  Fulfilled = 'Fulfilled',
  Cancelled = 'Cancelled',
}

// TODO this entity should be combined somehow with PartnerReferralEntity - perhaps this entity's details should be a data object in
//  PartnerReferralEntity, and on the app layer, we can implement specific considerations to ensure that the hypothetical subclass
//  of PartnerReferralEntity that references this object as its data object is returned.  This change should also entail converting
//  the ReferralEmbed object to an entity...
@Exclude()
@Entity({
  name: 'peer_referral',
})
export class PeerReferralEntity {
  @Column()
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn()
  @Expose({ groups: [UserRole.Staff] })
  public createdAt: Date;

  @ManyToOne(() => AwardCampaignEntity, {
    eager: true,
  })
  @Expose({ groups: [UserRole.Staff] })
  public awardCampaign: AwardCampaignEntity;

  @OneToOne(() => PatientUser, {
    eager: true,
  })
  @JoinColumn()
  @Expose({ groups: [UserRole.Staff] })
  public referree: PatientUser;

  @ManyToOne(() => PatientUser, {
    eager: true,
  })
  @Expose({ groups: [UserRole.Staff] })
  public referrer: PatientUser;

  @Column({ type: 'enum', enum: PeerReferralStatus, default: PeerReferralStatus.Pending })
  @IsIn(enumValues(PeerReferralStatus))
  @Expose({ groups: [UserRole.Staff] })
  public status: PeerReferralStatus;
}
