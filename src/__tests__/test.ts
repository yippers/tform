// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import Tform, { get, IJSONRecord, IRules } from '../index';

// Helper for tests below.
function testTform(description: string, record: IJSONRecord, rules: IRules, expected: IJSONRecord): void {
  test(description, () => {
    expect(Tform.transform(rules, record)).toEqual(expected);
  });
}

// tslint:disable:object-literal-sort-keys
describe('tform', () => {
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
    'static properties',
    {
      sex: 'male',
      name: {
        first: 'John',
        last: 'Doe',
      },
    },
    {
      string: 'sex',
      string_dotted: 'name.first',
      string_array: ['name', 'last'],
    },
    {
      string: 'male',
      string_dotted: 'John',
      string_array: 'Doe',
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
      dynamic: (g) => g('first.name'),
      dynamic_complex: (g) => g(['first', g('subfield') as string]),
      dynamic_nested: (g) => get(g('last'), g('subfield') as string),
      entire_record: (g) => g(),
    },
    {
      dynamic: 'John',
      dynamic_complex: 'John',
      dynamic_nested: 'Doe',
      entire_record: {
        first: { name: 'John' },
        last: { name: 'Doe' },
        subfield: 'name',
      },
    },
  );

  testTform(
    'complex return types for rules',
    {
      first: 'John',
      last: 'Doe',
    },
    {
      array: (g) => [g('first'), g('last')],
      map: (g) => ({
        given: g('first'),
        family: g('last'),
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
});
