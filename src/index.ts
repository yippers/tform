// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import * as _ from 'lodash';

// Define JSON interface.

type JSONPrimitive = number | boolean | string | null;
type JSONValue = JSONPrimitive | IJSONArray | IJSONRecord;

interface IJSONArray extends Array<JSONValue> {}

export interface IJSONRecord {
  [key: string]: JSONValue;
}

// Enable retrieval of properties.

type Path = string | string[]; // properties to access on object
type Getter = ((path?: Path) => JSONValue); // TODO: add default argument

type Rule = Path | ((getter: Getter) => JSONValue) | IRules;

export interface IRules {
  [key: string]: Rule;
}

export const get = _.get;

function getterFactory(record: IJSONRecord): Getter {
  function getter(path?: Path): JSONValue {
    if (path === undefined) {
      return record;
    }
    return _.get(record, path);
  }

  return getter;
}

// Expose main functionality.

// tslint:disable-next-line:max-classes-per-file
export default class Tform {
  public static transform(rules: IRules, record: IJSONRecord): IJSONRecord {
    const getter: Getter = getterFactory(record);
    const results: IJSONRecord = {};

    const mappedRules = new Map(_.toPairs(rules));
    mappedRules.forEach((value, key) => {
      results[key] = _.isFunction(value) ? value(getter) : getter(value as Path);
    });
    return results;
  }
}
