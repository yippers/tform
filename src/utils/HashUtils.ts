// Copyright (C) 2017 Rimeto, LLC. All Rights Reserved.

import * as crypto from 'crypto';

export default class HashUtils {
  // This is a synchronous method
  public static getMD5Hash(data: string | Buffer): string {
    return crypto
      .createHash('md5')
      .update(data, 'utf8')
      .digest('hex');
  }

  public static getUInt32Hash(data: Buffer | string): number {
    return crypto
      .createHash('md5')
      .update(data, 'utf8')
      .digest()
      .readUInt32LE(0);
  }
}
