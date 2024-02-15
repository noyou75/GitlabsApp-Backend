import { FileEntity } from '../../../entities/file.entity';

export class FileProcessorStatusDto {
  id?: string;
  generating: boolean;
  file?: FileEntity;
}
