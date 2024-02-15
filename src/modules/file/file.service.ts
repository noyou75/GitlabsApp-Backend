import { Inject, Injectable, Type } from '@nestjs/common';
import { join } from 'path';
import Jimp from 'jimp';
import { DeepPartial, getRepository } from 'typeorm';
import { cloneDeep, isObject, isEqual } from 'lodash';
import { FilePurpose, FilePurposeConfig } from '../../common/enums/file-purpose.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { FileEntity } from '../../entities/file.entity';
import { User } from '../../entities/user.entity';
import { CrudService } from '../api/crud/crud.service';
import { BasicConfig, GCPConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { StorageService } from '../core/services/storage.service';

@Injectable()
export class FileService extends CrudService(FileEntity) {
  @Inject()
  private readonly storage: StorageService;

  @Inject()
  private readonly config: ConfigService;

  async create(entity: FileEntity): Promise<FileEntity> {
    if (!entity.user) {
      entity.user = RequestContext.get<User>(REQUEST_CONTEXT_USER);
    }

    return super.create(entity);
  }

  stream(entity: FileEntity) {
    return this.storage.read(this.getBucket(entity), this.getPath(entity));
  }

  download(entity: FileEntity) {
    return this.storage.download(this.getBucket(entity), this.getPath(entity));
  }

  async exists(entity: FileEntity) {
    return await this.storage.exists(this.getBucket(entity), this.getPath(entity));
  }

  getPath(entity: FileEntity) {
    if (!entity.purpose || !entity.hash) {
      throw new Error('Both purpose and hash must be defined before a file path can be computed!');
    }

    return join(entity.purpose, entity.hash);
  }

  getBucket(entity: FileEntity): string {
    return this.config.get(this.isPublic(entity) ? GCPConfig.PublicBucket : GCPConfig.PrivateBucket);
  }

  isPublic(entity: FileEntity): boolean {
    switch (entity.purpose) {
      case FilePurpose.Avatar:
        return true;
      case FilePurpose.Thumbnail:
        return this.isPublic(entity.parent);
      default:
        return false;
    }
  }

  async getPublicUrl(entity: FileEntity): Promise<string> {
    const domain = this.config.get(BasicConfig.Domain);
    return this.isPublic(entity) ? new URL(this.getPath(entity), `https://public.${domain}`).href : await this.getSignedUrl(entity);
  }

  async getSignedUrl(entity: FileEntity) {
    /* Different file types may be configured with different TTLs. */
    return await this.storage.getSignedUrl(this.getBucket(entity), this.getPath(entity), {
      action: 'read',
      expires: Date.now() + (FilePurposeConfig.getFilePurposeConfig(entity.purpose)?.signedUrlTtl || 1000 * 60 * 60),
    });
  }

  /**
   * Rotates the supplied image by the supplied number of degrees.
   */
  async rotate(entity: FileEntity, degrees: number) {
    /* Validation - file must be an image. */
    if (!entity.isImage()) {
      throw new Error(`[FileService#rotate] Unable to rotate file - the supplied file is not an image.  File type: ${entity.type}`);
    }

    /* Retrieve the image data from the storage bucket */
    const imageData = await this.storage.download(this.getBucket(entity), this.getPath(entity));

    /* Perform the rotation operation */
    const data = await (await Jimp.read(imageData)).rotate(degrees).getBufferAsync((Jimp.AUTO as unknown) as string);

    /* Update the existing file entity with the new data buffer */
    entity.data = data.toString('base64');

    return await this.getRepository().save(entity);
  }

  async clearFiles<T>(entityType: Type<T>, updates: DeepPartial<T>, entity: T) {
    const _clearFiles = (_entity: any, _updates: any) => {
      /* Scan the supplied updates entity for all first-level objects that are either files, or arrays of files. */
      const updatesKeys = Object.keys(_updates);

      for (let i = updatesKeys.length - 1; i >= 0; i--) {
        const updatesKey = updatesKeys[i];
        const updateProp = _updates[updatesKey];

        /* Disqualified cases - primitives, objects that are not files, or files that are not deleted. */
        if (!isObject(updateProp) || !Object.keys(updateProp)?.length) {
          continue;
        } else if (!(_entity[updatesKey] instanceof FileEntity)) {
          _clearFiles(_entity[updatesKey], updateProp);
        } else if ((updateProp as FileEntity).isDeleted) {
          /* At this point, we know that we are dealing with a file that needs to be removed.  How we remove it from the current
           * object depends on what the current object is.  If it's an array, we need to splice it out.  Otherwise, we will set
           * the value to null. */
          if (Array.isArray(_entity)) {
            _entity.splice(
              _entity.findIndex((file) => file.id === (updateProp as FileEntity).id),
              1,
            );
          } else {
            /* Otherwise, we can simply set the key as null. */
            _entity[updatesKey] = null;
          }
        }
      }
    };

    const result = cloneDeep(entity);
    _clearFiles(result, updates);

    try {
      /* Extract the repository corresponding to the supplied type, and update the resulting entity. */
      return isEqual(entity, result) ? result : getRepository(entityType).save(result as DeepPartial<T>);
    } catch (err) {
      throw new Error(
        `Cannot remove files in embedded object - the supplied entity type does not have a repository defined. ` +
        `Entity Type = ${entityType}, exception: ${err}`,
      );
    }
  }
}
