// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import { filterFalse, get, IJSONRecord, IRules, splitList, Tform } from '../index';

// Helper for tests below.
function testTform(description: string, record: IJSONRecord, rules: IRules, expected: IJSONRecord): void {
  test(description, () => {
    const tform: Tform = new Tform(rules);
    const output = tform.apply(record);
    expect(tform.getErrors()).toEqual([]);
    expect(output).toEqual(expected);
  });
}

// tslint:disable:object-literal-sort-keys
describe('tform', () => {
  // function fakeprint(object: any): void {
  //   test('fake test', () => {
  //     expect(object).toBe('');
  //   });
  // }
  // fakeprint(typeof ([''] as string[]));

  testTform(
    'typing sanity check',
    {
      string: 'string',
      boolean: true,
      number: 0.5,
      array: [1, 2, 3],
      map: {
        depth: 'much',
        wow: 'very',
      },
    },
    {},
    {},
  );

  testTform(
    'static values',
    {
      age: 'idk',
      location: 'idk',
    },
    {
      age: 50,
      location: null,
      name: {
        first: 'John',
        last: 'Doe',
      },
    },
    {
      age: 50,
      location: null,
      name: {
        first: 'John',
        last: 'Doe',
      },
    },
  );

  testTform(
    'dynamic properties',
    {
      first: { name: 'John' },
      last: { name: 'Doe' },
      subfield: 'name',
    },
    {
      dynamic: ($) => $('first.name'),
      dynamic_complex: ($) => $(['first', $('subfield') as string]),
      dynamic_nested: ($) => get($('last'), $('subfield') as string),
      defaultValue: ($) => $('color', 'yellow'),
      // entire_record: (getter) => getter(),
    },
    {
      dynamic: 'John',
      dynamic_complex: 'John',
      dynamic_nested: 'Doe',
      defaultValue: 'yellow',
      // entire_record: {
      //   first: { name: 'John' },
      //   last: { name: 'Doe' },
      //   subfield: 'name',
      // },
    },
  );

  testTform(
    'complex return types for rules',
    {
      first: 'John',
      last: 'Doe',
    },
    {
      array: ($) => [$('first'), $('last')],
      map: ($) => ({
        given: $('first'),
        family: $('last'),
      }),
    },
    {
      array: ['John', 'Doe'],
      map: {
        given: 'John',
        family: 'Doe',
      },
    },
  );

  test('basic error handling', () => {
    const rules: IRules = {
      function_missing_path: ($) => $('bar'),
      function_error: () => {
        throw Error('oh noes!');
      },
    };
    const record1: IJSONRecord = {};
    const record2: IJSONRecord = { bar: 'bar' };

    const tform: Tform = new Tform(rules);
    expect(tform.apply(record1)).toEqual({});
    expect(tform.apply(record2)).toEqual({
      function_missing_path: 'bar',
    });
    expect(tform.getErrors()).toEqual([
      {
        error: Error('property not found: bar'),
        field: 'function_missing_path',
        record_no: 1,
        record_id: undefined,
        record_raw: {},
      },
      { error: Error('oh noes!'), field: 'function_error', record_no: 1, record_id: undefined, record_raw: {} },
      {
        error: Error('oh noes!'),
        field: 'function_error',
        record_no: 2,
        record_id: undefined,
        record_raw: { bar: 'bar' },
      },
    ]);
  });

  test('error reporting of record id', () => {
    const rules: IRules = { whoops: ($) => $('missing') };
    const record1: IJSONRecord = { pk: 1 };
    const record2: IJSONRecord = {};

    const tform: Tform = new Tform(rules, 'pk');
    expect(tform.apply(record1)).toEqual({});
    expect(tform.apply(record2)).toEqual({});
    expect(tform.getErrors()).toEqual([
      {
        error: Error('property not found: missing'),
        field: 'whoops',
        record_no: 1,
        record_id: 1,
        record_raw: record1,
      },
      {
        error: Error('property not found: pk'),
        record_no: 2,
        record_id: undefined,
        record_raw: record2,
      },
      {
        error: Error('property not found: missing'),
        field: 'whoops',
        record_no: 2,
        record_id: undefined,
        record_raw: record2,
      },
    ]);
  });

  testTform(
    'core utility functions',
    {
      a1: 'a1',
      a2: 'a2',
      b1: '',
      list: 'a, b, ,, c,',
    },
    {
      filterFalse: ($) => filterFalse($, ['a1', 'a2', 'b1', 'b2']),
      delimitedList: ($) => splitList($('list')),
    },
    {
      filterFalse: ['a1', 'a2'],
      delimitedList: ['a', 'b', 'c'],
    },
  );

  // testTform(
  //   'deep remapping',
  //   {
  //     hometown: 'San Francisco',
  //     country: 'United States',
  //   },
  //   {
  //     address: {
  //       city: 'hometown',
  //       country: 'country',
  //     },
  //   },
  //   {
  //     address: {
  //       city: 'San Francisco',
  //       country: 'United States',
  //     },
  //   },
  // );
});
