import { GetSignedUrlConfig, SaveOptions, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Injectable()
export class StorageService {
  storage: Storage;

  constructor(private readonly logger: LoggerService) {
    this.storage = new Storage();
  }

  getClient() {
    return this.storage;
  }

  async save(bucket: string, file: string, data: any, options?: SaveOptions) {
    this.logger.log(`Uploading to gs://${bucket}/${file}`);
    await this.file(bucket, file).save(data, options);
  }

  async exists(bucket: string, file: string) {
    const [exists] = await this.file(bucket, file).exists();
    this.logger.log(`Checking if gs://${bucket}/${file} exists... ${exists}`);
    return exists;
  }

  async delete(bucket: string, file: string) {
    this.logger.log(`Deleting gs://${bucket}/${file}`);
    await this.file(bucket, file).delete();
  }

  async getSignedUrl(bucket: string, file: string, options?: GetSignedUrlConfig) {
    const [url] = await this.file(bucket, file).getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60, ...options });
    return url;
  }

  async getMetadata(bucket: string, file: string) {
    const [metadata] = await this.file(bucket, file).getMetadata();
    return metadata;
  }

  read(bucket: string, file: string) {
    return this.file(bucket, file).createReadStream();
  }

  write(bucket: string, file: string) {
    return this.file(bucket, file).createWriteStream();
  }

  create(bucket: string, file: string) {
    return this.bucket(bucket).file(file);
  }

  async download(bucket: string, file: string) {
    return (await this.file(bucket, file).download())[0];
  }

  protected bucket(bucket: string) {
    return this.storage.bucket(bucket);
  }

  protected file(bucket: string, file: string) {
    return this.storage.bucket(bucket).file(file);
  }

  // async download() {}
  // move() { }
  // copy() {}
  // makePublic() {}
  // makePrivate() {}
}
