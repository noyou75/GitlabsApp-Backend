import { Exclude, Expose, Type } from 'class-transformer';
import { Column, CreateDateColumn } from 'typeorm';
import { DocumentType } from '../../common/enums/document-type.enum';
import { DocumentDto } from '../../modules/user/dto/document.dto';

@Exclude()
export class DocumentEmbed {
  @Column({ type: 'enum', enum: DocumentType, nullable: false })
  @Expose()
  type: DocumentType;

  @CreateDateColumn()
  @Type(() => Date)
  @Expose()
  completedAt?: Date = new Date();

  @Column({ nullable: false })
  @Expose()
  signature: string; // TODO: Validate document signature with HelloSign API

  static fromDto(dto: DocumentDto, completedAt?: Date): DocumentEmbed {
    const doc = new DocumentEmbed();

    doc.type = dto.type;
    doc.signature = dto.signature;
    doc.completedAt = completedAt || new Date();

    return doc;
  }
}
