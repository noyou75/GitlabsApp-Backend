import { Exclude, Expose } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { enumValues } from 'src/common/enum.utils';
import { LabCompany } from 'src/common/enums/lab-company.enum';
import { Column } from 'typeorm';
@Exclude()
export class LabAccountEmbed {
  // @Column({ type: 'enum', enum: LabCompany, nullable: true })
  // @IsIn(enumValues(LabCompany))
  @IsOptional()
  @Expose()
  company: LabCompany;

  @Column({ nullable: true })
  @IsOptional()
  @Expose()
  accountNumber: string;
}
