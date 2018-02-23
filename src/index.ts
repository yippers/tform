// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import * as _ from 'lodash';

export * from './deserializer';
export * from './utility';

// Define JSON interface.

export type JSONPrimitive = number | boolean | string | null;
export type JSONValue = JSONPrimitive | IJSONArray | IJSONRecord;

export interface IJSONArray extends Array<JSONValue> {}

export interface IJSONRecord {
  [key: string]: JSONValue;
}

// Enable retrieval of properties.

export type Path = string;
export type Getter = ((path: Path | Path[], defaultValue?: JSONValue) => JSONValue);
export type Rule = JSONValue | ((getter: Getter) => JSONValue) | IRules;

export interface IRules {
  [key: string]: Rule;
}

export const get = _.get;

// Create function for a record that accepts a property name and fetches that property value
function getterFactory(record: IJSONRecord): Getter {
  // TODO: Implement 'untrimmed' arg

  function getter(path?: Path | Path[], defaultValue?: JSONValue): JSONValue {
    if (path === undefined) {
      return record;
    }

    let value = get(record, path);
    if (_.isString(value)) {
      value = value.trim();
    }
    if (value === undefined && defaultValue !== undefined) {
      value = defaultValue;
    }

    if (value === undefined) {
      throw Error('property not found: ' + path);
    } else if (value === null) {
      throw Error('property is null: ' + path);
    }

    return value;
  }

  return getter;
}

// Primary interfaces and classes.

// tslint:disable:object-literal-sort-keys
export interface ITformError {
  error: Error;
  field?: string;

  record_no: number;
  record_raw: IJSONRecord;
  record_id?: JSONValue;
}

export class Tform {
  private errors: ITformError[] = [];
  private count: number = 0;

  constructor(private rules: IRules, private recordId?: Path) {}

  public apply(record: IJSONRecord): IJSONRecord {
    const results: IJSONRecord = {};
    const getter: Getter = getterFactory(record);
    this.count += 1;

    Object.keys(this.rules).forEach((key: string) => {
      const rule: Rule = this.rules[key];
      try {
        results[key] = _.isFunction(rule) ? rule(getter) : rule;
      } catch (e) {
        this.errors.push({
          error: e,
          record_no: this.count,
          record_id: this.extractID(record, getter),
          record_raw: record,
          field: key,
        });
      }
    });
    return results;
  }

  // TODO: Implement
  // public batch(records: IJSONRecord[]): IJSONRecord[] {
  // }

  // TODO: Implement
  // public static value(rule: Rule, record: IJSONRecord): JSONValue {
  //   const getter: Getter = getterFactory(record);
  //   return Tform.helper(rule, getter);
  // }

  public getErrors(): ITformError[] {
    return this.errors;
  }

  // TODO: Implement
  // public logError(Error: error): void {
  // }

  private extractID(record: IJSONRecord, getter: Getter) {
    if (this.recordId === undefined) {
      return undefined;
    }

    try {
      return getter(this.recordId);
    } catch (e) {
      this.errors.push({
        error: e,
        record_no: this.count,
        record_raw: record,
      });
    }
  }
}
