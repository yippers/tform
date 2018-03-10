// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import { JSONValue } from './index';

export function splitList(value: JSONValue, delimiter: string = ',') {
  if (typeof value !== 'string') {
    throw Error('cannot split non-string value: ' + value);
  }

  return value
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}
