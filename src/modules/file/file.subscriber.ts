import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import Jimp from 'jimp';
import { Connection, EntityManager, EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { FilePurpose } from '../../common/enums/file-purpose.enum';
import { checksum, mimeType, scaleImageToFit } from '../../common/file.utils';
import { FileEntity } from '../../entities/file.entity';
import { ConfigService } from '../core/services/config.service';
import { StorageService } from '../core/services/storage.service';
import { FileService } from './file.service';

@Injectable()
@EventSubscriber()
export class FileSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly service: FileService,
  ) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  listenTo() {
    return FileEntity;
  }

  async afterLoad(file: FileEntity) {
    try {
      file.url = await this.service.getPublicUrl(file);

      if (file.thumbnail) {
        // This side of the relation is not loaded automatically as it would cause an infinite loop, so assign it here
        file.thumbnail.parent = file;
        file.thumbnail.url = await this.service.getPublicUrl(file.thumbnail);
      }
    } catch (e) {
      // Sometimes afterLoad event doesn't contain full File entity, so url cannot be computed
      // This seems like a bug in TypeORM, need to verify
    }
  }

  async beforeInsert(event: InsertEvent<FileEntity>) {
    await this.upload(event.entity, event.manager);
  }

  async beforeUpdate(event: UpdateEvent<FileEntity>) {
    if (event.updatedColumns.find((metadata) => metadata.propertyName === 'hash')) {
      await this.upload(event.entity as FileEntity, event.manager);
    }
  }

  async afterRemove(event: RemoveEvent<FileEntity>) {
    // TODO: Implement removal of files from bucket
    // ! Due to deduplication based on file content hash, removal of files from bucket
    // ! must ensure that no other File entity is pointing to it
  }

  private async transform(file: FileEntity): Promise<Buffer> {
    const data = file.buffer;

    switch (file.purpose) {
      case FilePurpose.InsuranceFront:
      case FilePurpose.InsuranceRear:
        // Scale the image to a max size needed for print (300 dpi * 5"|6")
        return await scaleImageToFit(data, 300 * 6, 300 * 5, true);
      case FilePurpose.Avatar:
        return await (await Jimp.read(data))
          .cover(400, 400)
          .quality(80)
          .getBufferAsync((Jimp.AUTO as unknown) as string);
      case FilePurpose.Thumbnail:
        return await scaleImageToFit(data, 200, 200);
      // case FilePurpose.Signature:
      //   return await (await Jimp.read(data)).autocrop().getBufferAsync((Jimp.AUTO as unknown) as string);
      default:
        return data;
    }
  }

  private async upload(file: FileEntity, manager: EntityManager) {
    // Apply transformations to the file such as cropping for avatars or creation of thumbnails for documents
    const data = await this.transform(file);

    file.size = data.length;
    file.hash = checksum(data);
    file.type = (await mimeType(data)).mime;

    const bucket = this.service.getBucket(file);

    if (!(await this.storage.exists(bucket, this.service.getPath(file)))) {
      await this.storage.save(bucket, this.service.getPath(file), data, {
        contentType: file.type,
      });
    }

    file.url = await this.service.getPublicUrl(file);

    // Create a thumbnail
    if ([FilePurpose.InsuranceFront, FilePurpose.InsuranceRear].includes(file.purpose)) {
      const thumbnail = new FileEntity();

      thumbnail.parent = file;
      thumbnail.user = file.user;
      thumbnail.purpose = FilePurpose.Thumbnail;
      thumbnail.name = file.name;
      thumbnail.data = file.data;

      await manager.save(thumbnail);

      file.thumbnail = thumbnail;
    }
  }

  private async remove(file: FileEntity) {
    await this.storage.delete(this.service.getBucket(file), this.service.getPath(file));
  }
}
