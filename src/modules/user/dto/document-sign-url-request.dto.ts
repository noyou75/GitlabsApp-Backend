import { Exclude, Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { DocumentType } from '../../../common/enums/document-type.enum';

@Exclude()
export class DocumentSignUrlRequestDto {
  @IsIn([DocumentType.EEA, DocumentType.W4])
  @Expose()
  type: DocumentType;
}
