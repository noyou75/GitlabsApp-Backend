import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsAlphanumeric, IsBoolean, IsInt, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { IsUnique } from '../modules/shared/constraints/is-unique.constraint';
import { ScheduleEmbed } from './embed/schedule.embed';
import { LabAccountEmbed } from './embed/lab-account.embed';
import { ServiceAreaEntity } from './service-area.entity';

@Entity({
  name: 'market',
  orderBy: {
    name: 'ASC',
  },
})
@Exclude()
export class MarketEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @Column()
  @Expose()
  name: string;

  private _code: string;

  @Column({ unique: true, update: false })
  @IsUnique({ message: 'isUniqueMarketCode' })
  @IsAlphanumeric()
  @Expose()
  set code(value: string) {
    // Strip non-alphanumeric chars and upper case it
    this._code =
      value !== undefined
        ? String(value)
            .replace(/[^0-9a-z]/gi, '')
            .toUpperCase()
        : value;
  }

  get code(): string {
    return this._code;
  }

  @Column()
  @IsNumber()
  @IsInt()
  @Expose({ groups: [UserRole.Staff] })
  price: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (value) => plainToClass(ScheduleEmbed, value, { excludeExtraneousValues: true }),
      from: (value) => plainToClass(ScheduleEmbed, value),
    },
  })
  @Type(() => ScheduleEmbed)
  @ValidateNested()
  @IsOptional()
  @Expose({ groups: [UserRole.Staff] })
  schedule: ScheduleEmbed;

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (value) => plainToClass(LabAccountEmbed, value, { excludeExtraneousValues: true }),
      from: (value) => plainToClass(LabAccountEmbed, value),
    },
  })
  @Type(() => LabAccountEmbed)
  @ValidateNested()
  @IsOptional()
  @Expose({ groups: [UserRole.Staff] })
  labAccountCodes: LabAccountEmbed[];

  @Column()
  @IsBoolean()
  @Expose({ groups: [UserRole.Staff] })
  isActive: boolean;

  @CreateDateColumn()
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  createdAt: Date;

  @UpdateDateColumn()
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  updatedAt: Date;

  @OneToMany(() => ServiceAreaEntity, (serviceArea) => serviceArea.market)
  @Expose({ toPlainOnly: true, groups: [UserRole.Staff] })
  serviceAreas: ServiceAreaEntity[];
}
