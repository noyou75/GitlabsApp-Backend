import { Injectable } from '@nestjs/common';
import { DeepPartial, getRepository } from 'typeorm';
import { cloneDeep } from 'lodash';
import { FileEntity } from '../../entities/file.entity';
import { LabOrderDetailsEntity } from '../../entities/lab-order-details.entity';
import { CrudService } from '../api/crud/crud.service';

@Injectable()
export class LabOrderDetailsService extends CrudService(LabOrderDetailsEntity) {
  /**
   * Removes the supplied files from the supplied LabOrderDetailsEntity instance
   */
  async removeFiles(labOrderDetailsEntity: LabOrderDetailsEntity, filesToDelete: DeepPartial<FileEntity>[]) {
    /* Deep copy the inbound object and formulate an updated collection that will resemble the collection set related to this lab order */
    const updated = cloneDeep(labOrderDetailsEntity);
    updated.labOrderFiles = updated.labOrderFiles.filter(
      (labOrderFile) => !filesToDelete.some((fileToDelete) => fileToDelete.id === labOrderFile.id),
    );

    return getRepository(LabOrderDetailsEntity).save(updated);
  }
}
