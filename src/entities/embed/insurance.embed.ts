import { Exclude, Expose } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { Column, ManyToOne } from 'typeorm';
import { JoinColumn } from 'typeorm/decorator/relations/JoinColumn';
import { FileEntity } from '../file.entity';

@Exclude()
export class InsuranceEmbed {
  @ManyToOne(() => FileEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({
    // Temporarily set column name manually until this bug is fixed: https://github.com/typeorm/typeorm/issues/3132
    name: 'insuranceFrontId',
  })
  // @IsOptional()
  // @IsRelationIdentifier()
  @Expose()
  front: FileEntity; // TODO: Validate is existing

  @ManyToOne(() => FileEntity, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({
    // Temporarily set column name manually until this bug is fixed: https://github.com/typeorm/typeorm/issues/3132
    name: 'insuranceRearId',
  })
  // @IsOptional()
  // @IsRelationIdentifier()
  @Expose()
  rear: FileEntity; // TODO: Validate is existing

  // TODO: Leave expiresAt column here for now, TypeORM has an issue with embedded entities that only
  //  contain relations and does not initialize object before attempting to hydrate them.
  //  This results in an "trying to access 'front' property on undefined" error.

  @Column({ nullable: true })
  @IsOptional()
  @IsDate({ message: '$property must ba a valid date in the form of YYYY-MM-DD' })
  expiresAt: Date;

  hasInsurance(): boolean {
    return !!this.front || !!this.rear;
  }
}
