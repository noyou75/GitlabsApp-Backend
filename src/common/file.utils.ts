import crypto, { HexBase64Latin1Encoding } from 'crypto';
import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';
import { NotificationTypes } from '../modules/notification/notification';
import { rootDir } from '../root';
import fileType = require('file-type');

interface UndefinedFileTypeResult {
  ext: 'bin';
  mime: 'application/octet-stream';
}

export function checksum(data: Buffer, algorithm?: string, encoding?: HexBase64Latin1Encoding) {
  return crypto
    .createHash(algorithm || 'sha256')
    .update(data)
    .digest(encoding || 'hex');
}

export async function mimeType(data: Buffer): Promise<fileType.FileTypeResult | UndefinedFileTypeResult> {
  return (await fileType.fromBuffer(data)) || { ext: 'bin', mime: 'application/octet-stream' };
}

export function loadFile(p: string, encoding?: string): string {
  return fs.readFileSync(path.resolve(rootDir, p)).toString(encoding);
}

export function loadNotificationTemplate(notification: string, type: NotificationTypes | 'slack'): string {
  return loadFile(`views/notifications/${notification}/${notification}.${type}.hbs`);
}

export async function isImage(data: Buffer): Promise<boolean> {
  return ['image/png', 'image/jpeg'].includes((await mimeType(data)).mime);
}

export async function scaleImageToFit(data: Buffer, w: number, h: number, ignoreUndersizedDimensions?: boolean): Promise<Buffer> {
  const image = await Jimp.read(data);

  if (!ignoreUndersizedDimensions || (ignoreUndersizedDimensions && (image.bitmap.width > w || image.bitmap.height > h))) {
    image.scaleToFit(w, h);
  }

  return await image.quality(80).getBufferAsync((Jimp.AUTO as unknown) as string);
}
