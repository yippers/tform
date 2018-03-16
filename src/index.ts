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

function isPrimitive(obj: any): obj is JSONPrimitive {
  return ['string', 'number', 'boolean'].indexOf(obj) >= 0 || obj === null;
}

// Define rules interface.

export type Rule<Record> = JSONPrimitive | ((record: Record) => any) | IRulesInternal<Record>;

// Internal definition of IRules, not wrapped with `Defaultable`.
export interface IRulesInternal<Record> {
  [key: string]: Rule<Record>;
}

// Given a record, convert properties to methods that optionally take a fallback value.
function wrapRecord<Record extends object, Key extends keyof Record>(record: Record) {
  return new Proxy(record, {
    get(target: Record, name: Key): (fallback?: any) => Key {
      const value = target[name];
      return (fallback: any) => (value !== undefined ? value : fallback);
    },
  });
}

// Convert record into wrapped version as per `wrapRecord`.
export type Defaultable<Record> = { [key in keyof Record]: (fallback?: any) => Record[key] };

// IRules wrapped by `Defaultable` suitable for public use.
export type IRules<Record> = IRulesInternal<Defaultable<Record>>;

// Define main classes.

export interface ITformError {
  error: Error;
  field?: string; // unset if record-level error instead of field-level error

  record_no: number;
  record_raw: IJSONRecord;
  record_id?: JSONValue; // unset if no `idKey` provided to `Tform` instance
}

// tslint:disable:member-ordering
export class Tform<Record> {
  private errors: ITformError[] = [];
  private recordCount: number = 0;

  constructor(private rules: IRules<Record>, private idKey?: string) {}

  // Transformation methods.

  private processRules(rules: IRules<Record>, results: any, record: IJSONRecord) {
    Object.keys(rules).forEach((key: string) => {
      const rule = rules[key];

      try {
        if (isPrimitive(rule)) {
          results[key] = rule;
        } else if (_.isFunction(rule)) {
          const wrappedRecord = wrapRecord<Record & object, keyof Record>(record as any);
          results[key] = (rule as any)(wrappedRecord);
        } else {
          // case where `rule` is actually nested `IRules`
          results[key] = {};
          this.processRules(rule as IRules<Record>, results[key], record);
        }

        if (results[key] === undefined) {
          // noinspection ExceptionCaughtLocallyJS
          throw Error(`property '${key}' of result is undefined`);
        }

        if (_.isString(results[key])) {
          results[key] = results[key].trim();
        }
      } catch (e) {
        this.addError(e, record, key);
      }
    });
  }

  public transform(record: IJSONRecord): IJSONRecord {
    this.recordCount += 1;
    this.verifyHasID(record);

    const results: IJSONRecord = {};
    this.processRules(this.rules, results, record);
    return results;
  }

  // Error-handling methods.

  public getErrors(): ITformError[] {
    return this.errors;
  }

  private verifyHasID(record: IJSONRecord) {
    if (this.idKey && !record[this.idKey]) {
      this.addError(TypeError(`Missing ID key '${this.idKey}'`), record);
    }
  }

  private extractID(record: IJSONRecord) {
    return this.idKey ? record[this.idKey] : undefined;
  }

  private addError(error: Error, record: IJSONRecord, field?: string) {
    this.errors.push({
      error,
      field,

      record_no: this.recordCount,
      record_raw: record,
      record_id: this.extractID(record),
    });
  }
}
