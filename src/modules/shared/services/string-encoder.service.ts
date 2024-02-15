import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { BasicConfig } from '../../core/enums/config.enum';

@Injectable()
export class StringEncoderService {
  constructor(@Inject(BasicConfig.Secret) private readonly secret: string) {}

  encrypt(str: string): string {
    // random initialization vector
    const iv = crypto.randomBytes(16);

    // random salt
    const salt = crypto.randomBytes(64);

    // derive key: 32 byte key length - in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    const key = crypto.pbkdf2Sync(this.secret, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  decrypt(str: string): string {
    // base64 decoding
    const bData = Buffer.from(str, 'base64');

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text = bData.slice(96);

    // derive key using; 32 byte key length
    const key = crypto.pbkdf2Sync(this.secret, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // decrypt the given text
    // @ts-ignore TS complains here, not sure why...
    return decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
  }

  static async encode(raw: string, cost: number = 10): Promise<string> {
    if (cost < 4 || cost > 31) {
      // Note: Costs above ~15 are likely to take more than 2 sec/hash to compute
      throw new RangeError('Cost must >= 4 and <= 31');
    }

    return await bcrypt.hash(StringEncoderService.sha256(raw), cost);
  }

  static async compare(raw: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(StringEncoderService.sha256(raw), hash);
  }

  static base64Encode(str: string) {
    return Buffer.from(str).toString('base64');
  }

  static base64Decode(str: string, binary?: boolean) {
    const buffer = Buffer.from(str, 'base64');
    return binary ? buffer : buffer.toString('ascii');
  }

  static base64JsonDecode<T>(str: string): T {
    try {
      return JSON.parse(StringEncoderService.base64Decode(str) as string);
    } catch (e) {
      return null;
    }
  }

  /**
   * Hash raw data with sha256 to avoid restricting max pre-encoded string
   * length to 72 due to a bcrypt limitation.
   */
  static sha256(raw: string): string {
    return crypto
      .createHash('sha256')
      .update(raw)
      .digest('base64');
  }

  static sign(str: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(str)
      .digest('hex');
  }
}
