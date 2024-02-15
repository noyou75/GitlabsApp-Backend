import { Exclude, Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { DocumentType } from '../../../common/enums/document-type.enum';

@Exclude()
export class DocumentDto {
  @IsIn(enumValues(DocumentType))
  @Expose()
  type: DocumentType;

  @ValidateIf((o: DocumentDto) => [DocumentType.EEA, DocumentType.W4].includes(o.type))
  @IsNotEmpty()
  @Expose()
  signature: string;
}
