// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import * as _ from 'lodash';

export interface IRules {
  [key: string]: ((record: any) => any) | string;
}

export default class Tform {
  public static transform(rules: IRules, record: any) {
    const results: any = {};
    const mappedRules = new Map(_.toPairs(rules));
    const wrappedRecord = new WrappedRecord(record);
    mappedRules.forEach((value, key) => {
      _.isFunction(value) ? (results[key] = value(wrappedRecord)) : (results[key] = wrappedRecord.get(value));
    });
    return results;
  }
}

// tslint:disable-next-line:max-classes-per-file
class WrappedRecord {
  private _record: WrappedRecord;
  constructor(record: any) {
    this._record = record;
  }

  public get(path: any): string | undefined {
    return _.get(this._record, path, undefined);
  }

  public getTrim(path: any): string | undefined {
    return _.get(this._record, path, undefined) ? _.get(this._record, path, '').trim() : undefined;
  }
}
