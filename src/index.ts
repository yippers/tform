// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import * as _ from 'lodash';
import { type } from 'os';

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

// Primary interfaces and classes.

export type Rule<Record> = JSONPrimitive | ((record: Record) => any) | IRules<Record>;

export interface IRules<Record> {
  [key: string]: Rule<Record>;
}

export type IRulesPublic<Record> = IRules<Defaultable<Record>>;

export type Defaultable<Record> = { [key in keyof Record]: (fallback?: any) => Record[key] };

function defaultFromType(value: any) {
  switch (typeof value) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    default:
      return undefined;
  }
}

function wrapRecord<Record extends object, Key extends keyof Record>(record: Record) {
  return new Proxy(record, {
    get(target: Record, name: Key): (fallback?: any) => Key {
      const value = target[name];
      return (fallback?: any) => {
        if (value !== undefined) {
          return value;
        } else if (fallback !== undefined) {
          return fallback;
        } else {
          return defaultFromType(value);
        }
      };
    },
  });
}

export interface ITformError {
  error: Error;
  field?: string;

  record_no: number;
  record_raw: IJSONRecord;
  record_id?: JSONValue;
}

// tslint:disable:member-ordering
export class Tform<Record> {
  private errors: ITformError[] = [];
  private recordCount: number = 0;

  constructor(private rules: IRulesPublic<Record>, private idKey?: string) {}

  private processRules(rules: IRulesPublic<Record>, results: any, record: IJSONRecord) {
    Object.keys(rules).forEach((key: string) => {
      const rule = rules[key];

      try {
        if (isPrimitive(rule)) {
          results[key] = rule;
        } else if (_.isFunction(rule)) {
          results[key] = rule(wrapRecord<Record & object, keyof Record>(record as any));
        } else {
          // if (rule is nested IRules)
          results[key] = {};
          this.processRules(rule as IRulesPublic<Record>, results[key], record);
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

  public apply(record: IJSONRecord): IJSONRecord {
    this.recordCount += 1;
    this.checkID(record);

    const results: IJSONRecord = {};
    this.processRules(this.rules, results, record);
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

  private addError(error: Error, record: IJSONRecord, field?: string) {
    this.errors.push({
      error,
      field,

      record_no: this.recordCount,
      record_raw: record,
      record_id: this.extractID(record),
    });
  }

  private checkID(record: IJSONRecord) {
    if (this.idKey && !record[this.idKey]) {
      this.addError(TypeError(`Missing ID key '${this.idKey}'`), record);
    }
  }

  private extractID(record: IJSONRecord) {
    return this.idKey && record[this.idKey];
  }
}
