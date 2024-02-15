import { Injectable } from '@nestjs/common';
import gm from 'gm';
import StreamSplitter from 'stream-splitter';
import { mimeType } from '../../../common/file.utils';

@Injectable()
export class PdfService {
  async toImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    if ((await mimeType(pdfBuffer)).mime !== 'application/pdf') {
      throw new Error('Buffer must contain PDF file!');
    }

    const images: Buffer[] = [];

    // PNG header bytes
    const split = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    return new Promise((resolve, reject) => {
      // Split the stream at each PNG header
      const stream = StreamSplitter(split);

      stream.on('token', (token) => {
        if (token.length > 0) {
          images.push(Buffer.from(Buffer.concat([split, token])));
        }
      });

      stream.on('done', () => {
        resolve(images);
      });

      stream.on('error', (err) => {
        reject(err);
      });

      gm.subClass({ imageMagick: true })(pdfBuffer).command('convert').density(96, 96).stream('png').pipe(stream);
    });
  }
}
