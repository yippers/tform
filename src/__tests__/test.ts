// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import { IJSONRecord, IRules, splitList, Tform } from '../index';

describe('tform', () => {
  test('basic transforming', () => {
    interface IPerson {
      job: string;
      name: string;
      age?: number;
      hobbies: string;
      address: {
        city?: string;
        zip: number;
      };
    }

    const record = {
      job: 'Engineer ',
      name: 'John Doe',
      hobbies: 'Biking, Skating,,',
      address: {
        city: 'Cupertino',
        zip: null,
      },
    };

    const rules: IRules<IPerson> = {
      job: (X) => X.job,
      name: {
        first: (X) => X.name.split(' ')[0],
        last: (X) => X.name.split(' ')[1],
      },
      age: (X) => X.age || -1,
      hobbies: (X) => splitList(X.hobbies),
      address: {
        city: (X) => X.address.city || '',
        zip: (X) => X.address.zip,
      },
    };

    const expected = {
      job: 'Engineer',
      name: {
        first: 'John',
        last: 'Doe',
      },
      age: -1,
      hobbies: ['Biking', 'Skating'],
      address: {
        city: 'Cupertino',
        zip: null,
      },
    };

    const tform = new Tform<IPerson>(rules);
    const output = tform.apply(record);
    expect(output).toEqual(expected);
  });

  test('basic error handling', () => {
    const rules: IRules<any> = {
      error: () => {
        throw Error('oh noes!');
      },
      missing: (X) => X.foo,
    };

    const record1: IJSONRecord = { foo: 1 };
    const record2: IJSONRecord = {};

    const tform = new Tform(rules);
    expect(tform.apply(record1)).toEqual({ missing: 1 });
    expect(tform.apply(record2)).toEqual({ missing: undefined });

    expect(tform.getErrors()).toEqual([
      {
        error: Error('oh noes!'),
        field: 'error',
        record_id: undefined,
        record_no: 1,
        record_raw: { foo: 1 },
      },
      {
        error: Error('oh noes!'),
        field: 'error',
        record_id: undefined,
        record_no: 2,
        record_raw: {},
      },
      {
        error: Error("property 'missing' of result is undefined"),
        field: 'missing',
        record_id: undefined,
        record_no: 2,
        record_raw: {},
      },
    ]);
  });

  test('error reporting of record id', () => {
    const rules: IRules<any> = {
      missing: (X) => X.foo,
    };
    const record1 = { pk: 1 };
    const record2 = {};

    const tform = new Tform(rules, 'pk');
    expect(tform.apply(record1)).toEqual({});
    expect(tform.apply(record2)).toEqual({});
    expect(tform.getErrors()).toEqual([
      {
        error: Error("property 'missing' of result is undefined"),
        field: 'missing',
        record_id: 1,
        record_no: 1,
        record_raw: { pk: 1 },
      },
      {
        error: TypeError("Missing ID key 'pk'"),
        record_no: 2,
        record_raw: {},
      },
      {
        error: Error("property 'missing' of result is undefined"),
        field: 'missing',
        record_id: undefined,
        record_no: 2,
        record_raw: {},
      },
    ]);
  });
});
