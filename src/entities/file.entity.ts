import { Exclude, Expose } from 'class-transformer';
import { IsBase64, IsIn, IsNotEmpty } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { FilePurpose } from '../common/enums/file-purpose.enum';
import { IsBase64ByteLength } from '../modules/shared/constraints/is-base64-byte-length.constraint';
import { Filterable } from '../modules/shared/decorators/filterable.decorator';

import { PatientUser, SpecialistUser, StaffUser, User } from './user.entity';

@Entity({
  name: 'file',
  orderBy: {
    createdAt: 'DESC',
  },
})
@Exclude()
export class FileEntity {
  @Filterable()
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @OneToOne(() => FileEntity, (file) => file.parent, { onDelete: 'SET NULL' })
  @JoinColumn()
  @Expose({ toPlainOnly: true })
  thumbnail: FileEntity;

  @OneToOne(() => FileEntity, (file) => file.thumbnail)
  parent: FileEntity;

  @ManyToOne(() => PatientUser)
  patient: PatientUser;

  @ManyToOne(() => SpecialistUser)
  specialist: SpecialistUser;

  @ManyToOne(() => StaffUser)
  staff: StaffUser;

  @Column({ type: 'enum', enum: FilePurpose })
  @IsIn(enumValues(FilePurpose))
  @Expose()
  purpose: FilePurpose;

  @Column()
  hash: string;

  @Column()
  @IsNotEmpty()
  @Expose()
  name: string;

  @Column()
  @Expose({ toPlainOnly: true })
  size: number;

  @Column()
  @Expose({ toPlainOnly: true })
  type: string;

  private _data: string; // TODO: Mime type validation (pdf, png, jpeg?)

  @CreateDateColumn()
  @Expose({ toPlainOnly: true })
  createdAt: Date;

  @Expose({ toPlainOnly: true })
  url: string; // Presigned URL filled in by subscriber

  @Expose({ toClassOnly: true })
  isDeleted: boolean;

  get user(): User {
    return this.patient || this.specialist || this.staff;
  }

  set user(user: User) {
    // Use "if" type guards until switch or constructor type guards are supported
    // See: https://github.com/Microsoft/TypeScript/issues/23274

    if (user instanceof PatientUser) {
      this.patient = user;
    } else if (user instanceof SpecialistUser) {
      this.specialist = user;
    } else if (user instanceof StaffUser) {
      this.staff = user;
    } else {
      throw new TypeError(`Unsupported User type: ${user.constructor.name}`);
    }
  }

  @IsNotEmpty()
  @IsBase64()
  @IsBase64ByteLength(0, 26214400) // 25mb
  @Expose({ toClassOnly: true })
  get data() {
    return this._data;
  }

  set data(data: string) {
    this._data = data;
    this._buffer = null;
    this.type = null;
    this.hash = null;
    this.size = null;
  }

  private _buffer: Buffer;

  get buffer(): Buffer {
    if (!this._buffer) {
      this._buffer = Buffer.from(this.data, 'base64');
    }
    return this._buffer;
  }

  set buffer(buffer: Buffer) {
    this._buffer = buffer;
  }

  isImage(): boolean {
    return ['image/png', 'image/jpeg'].includes(this.type);
  }

  isPDF(): boolean {
    return this.type === 'application/pdf';
  }
}
