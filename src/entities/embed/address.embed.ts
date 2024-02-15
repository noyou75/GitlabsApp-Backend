import { Exclude, Expose, Transform } from 'class-transformer';
import { IsNumberString, IsOptional } from 'class-validator';
import { Point } from 'geojson';
import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IsExactLength } from '../../modules/shared/constraints/is-exact-length.constraint';
import { IsUsState } from '../../modules/shared/constraints/is-us-state.constraint';
import { ServiceAreaEntity } from '../service-area.entity';

@Exclude()
export class AddressEmbed {
  @Column({ nullable: true })
  @IsOptional()
  @Expose()
  street: string;

  @Column({ nullable: true })
  @IsOptional()
  @Expose()
  unit: string;

  @Column({ nullable: true })
  @IsOptional()
  @Expose()
  city: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUsState()
  @Expose()
  state: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumberString()
  @IsExactLength(5)
  @Expose()
  zipCode: string;

  @Column('geography', { nullable: true, spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  @Expose({ toPlainOnly: true })
  @Transform(
    (value: Point) => {
      // Geospatial databases store coordinates as x=lng/y=lat, but most mapping frameworks specify
      // coordinates as x=lat/y=lng, so the coordinate order must be reversed for compatibility.
      value?.coordinates.reverse();

      return value;
    },
    { toPlainOnly: true },
  )
  geo: Point;

  // This value is currently populate in the controller after typeorm finishes because 0.2.x does not support "selectAndMap"
  @Expose({ toPlainOnly: true })
  distance: number;

  @Expose({ toPlainOnly: true })
  get composed(): string {
    return [[this.street, this.unit].filter(Boolean).join(' '), this.city, this.state, this.zipCode].filter(Boolean).join(', ');
  }

  isCompleted(): boolean {
    return !!this.street && !!this.city && !!this.state && !!this.zipCode;
  }
}

@Exclude()
export class AddressWithServiceAreaEmbed extends AddressEmbed {
  @ManyToOne(() => ServiceAreaEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({
    // Temporarily set column name manually until this bug is fixed: https://github.com/typeorm/typeorm/issues/3132
    name: 'addressServiceAreaId',
  })
  @Expose({ toPlainOnly: true })
  serviceArea: ServiceAreaEntity;
}
