import { IsIn, IsLatLong, IsOptional } from 'class-validator';
import { Position } from 'geojson';
import { enumValues } from '../../../../common/enum.utils';
import { LabCompany } from '../../../../common/enums/lab-company.enum';
import { SearchParams } from "../../../api/crud/search.params";

export class LabLocationListDto extends SearchParams {
  @IsOptional()
  @IsIn(enumValues(LabCompany), { each: true })
  lab: LabCompany | LabCompany[];

  @IsOptional()
  @IsLatLong()
  near: string;

  get coordinates(): Position {
    const coords = this.near ? this.near.split(',').map(p => Number(p)) : null;
    return coords && coords.length === 2 ? coords : null;
  }
}
