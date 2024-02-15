import { Exclude, Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInstance, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import slug from 'slug';
import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { LabCompany } from '../common/enums/lab-company.enum';
import { AddressEmbed } from './embed/address.embed';
import { UserRole } from '../common/enums/user-role.enum';
import { MarketEntity } from './market.entity';
import { MarketFilterable } from '../modules/market/decorator/market.decorator';
import { IsUnique}  from "../modules/shared/constraints/is-unique.constraint";
import { Filterable } from "../modules/shared/decorators/filterable.decorator";

@Entity({
  name: 'lab_location',
})
@Index(['address.zipCode'])
@Unique(['lab', 'place_id'])
@Exclude()
@MarketFilterable({
  query: (qb, markets) => {
    qb.innerJoin(`${qb.alias}.markets`, 'm');
    qb.andWhere('m.id IN (:...markets)', { markets: (markets ?? []).map((market) => market.id) });
  },
})
export class LabLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @Column()
  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsUnique({ compositeProperties: ['lab'], message: 'isUniqueLabLocationAddress' })
  place_id: string;

  @Column({ unique: true, nullable: true })
  @Expose({ toPlainOnly: true })
  slug: string;

  @Column({ type: 'enum', enum: LabCompany })
  @IsNotEmpty()
  @IsString()
  @IsIn(enumValues(LabCompany))
  @Expose()
  lab: LabCompany;

  @Column(() => AddressEmbed)
  @Type(() => AddressEmbed)
  @ValidateNested()
  @Expose()
  address: AddressEmbed;

  @Column({ default: true })
  @IsBoolean()
  @IsOptional()
  @Filterable()
  @Expose({ groups: [UserRole.Staff] })
  active: boolean;

  @Column({ default: true })
  @IsBoolean()
  @IsOptional()
  @Expose({ groups: [UserRole.Staff] })
  public?: boolean;

  @Column('jsonb', { nullable: true })
  @IsArray()
  @IsOptional()
  @Expose()
  services: string[];

  @Column('jsonb', { nullable: true })
  @IsArray()
  @IsOptional()
  @Expose()
  notes: string[];

  setSlug() {
    this.slug = slug(this.address.composed, slug.defaults.modes.rfc3986);
  }

  @ManyToMany(() => MarketEntity, { eager: true, cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'lab_location_market',
  })
  @Type(() => MarketEntity)
  @IsInstance(MarketEntity, { each: true })
  @IsOptional()
  @Filterable()
  @Expose({ groups: [UserRole.AdminStaffWrite, UserRole.Staff, UserRole.PatientRead] })
  markets: MarketEntity[];
}
