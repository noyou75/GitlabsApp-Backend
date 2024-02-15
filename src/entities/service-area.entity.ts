import { Exclude, Expose } from 'class-transformer';
import { IsPostalCode } from 'class-validator';
import { Point } from 'geojson';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsUnique } from '../modules/shared/constraints/is-unique.constraint';
import { MarketEntity } from './market.entity';

@Entity({
  name: 'service_area',
  orderBy: {
    zipCode: 'ASC',
  },
})
@Exclude()
export class ServiceAreaEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @ManyToOne(() => MarketEntity, { nullable: false, onDelete: 'CASCADE', eager: true })
  @Expose()
  market: MarketEntity;

  @Column({ nullable: true })
  @Expose()
  city: string;

  @Column({ nullable: true })
  @Expose()
  county: string;

  @Column()
  @Expose()
  state: string;

  @Column({ unique: true, update: false })
  @IsUnique({ message: 'isUniqueZipCode' })
  @IsPostalCode('US')
  @Expose()
  zipCode: string;

  @Column('geography', { nullable: false, spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  @Expose({ toPlainOnly: true })
  geo: Point;

  @Column()
  @Expose({ toPlainOnly: true })
  timezone: string;

  @Column({ nullable: false })
  @Expose()
  active: boolean;
}
