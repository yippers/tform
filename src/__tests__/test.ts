// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import Tform, { IRules } from '../index';
import HashUtils from '../utils/HashUtils';

// tslint:disable:object-literal-sort-keys
describe('TformUtils', () => {
  describe('Should transform stuff correctly', () => {
    it('does array mapping correctly', () => {
      const row = {
        first: {
          name: 'Pratik',
        },
        last: {
          name: 'Naik',
        },
        subField: 'name',
      };
      const arrayRules: IRules = {
        fullName: (r) => [r.get(['first', r.get('subField')]), r.get(['last', 'name'])],
      };
      const arrayVal = Tform.transform(arrayRules, row);
      const expectedVal = {
        fullName: ['Pratik', 'Naik'],
      };
      expect(arrayVal).toEqual(expectedVal);
    });

    it('does collapse mapping correctly', () => {
      const collapse = {
        name1: 'Alice',
        name2: 'Bob',
        name3: 'Jerry',
      };
      const collapseRules: IRules = {
        names: (r) => [r.get('name1'), r.get('name2'), r.get('name3')].join('-'),
      };
      const collapseVal = Tform.transform(collapseRules, collapse);
      const expectedVal = {
        names: 'Alice-Bob-Jerry',
      };
      expect(collapseVal).toEqual(expectedVal);
    });

    it('does deep mapping correctly', () => {
      const deep = {
        name: 'Alice',
        addressStreet: '730 Florida St.',
        addressCity: 'San Francisco',
        addressState: 'CA',
      };

      const deepRules: IRules = {
        person: (r) => ({
          name: r.get('name'),
          addressHash: HashUtils.getMD5Hash(
            [r.get('addressStreet'), r.get('addressCity'), r.get('addressState')].join('-'),
          ),
        }),
        address: (r) => ({
          hash: HashUtils.getMD5Hash([r.get('addressStreet'), r.get('addressCity'), r.get('addressState')].join('-')),
          street: r.get('addressStreet'),
          city: r.get('addressCity'),
          state: r.get('addressState'),
        }),
      };

      const deepVal = Tform.transform(deepRules, deep);
      const expectedVal = {
        person: {
          name: 'Alice',
          addressHash: '375fdf22c1b962bd4586cb02b143717e',
        },
        address: {
          hash: '375fdf22c1b962bd4586cb02b143717e',
          street: '730 Florida St.',
          city: 'San Francisco',
          state: 'CA',
        },
      };
      expect(deepVal).toEqual(expectedVal);
    });

    it('does flatten mapping correctly', () => {
      const flatten = {
        person: {
          name: 'Alice',
        },
        address: {
          street: '730 Florida',
          city: 'San Francisco',
          state: 'CA',
        },
      };

      const flattenRules: IRules = {
        name: 'person.name',
        street: 'address.street',
        city: 'address.city',
        state: 'address.state',
      };

      const flattenVal = Tform.transform(flattenRules, flatten);
      const expectedVal = {
        name: 'Alice',
        street: '730 Florida',
        city: 'San Francisco',
        state: 'CA',
      };
      expect(flattenVal).toEqual(expectedVal);
    });

    it('does conditional mapping correctly', () => {
      const conditional1 = {
        prop1: null,
        prop2: 'non-empty-1',
      };
      const conditional2 = {
        prop1: 'non-empty-3',
        prop2: 'non-empty-4',
      };

      const conditionalRules: IRules = {
        prop: (r) => r.get('prop1') || r.get('prop2'),
      };

      const conditionalVal1 = Tform.transform(conditionalRules, conditional1);
      const conditionalVal2 = Tform.transform(conditionalRules, conditional2);
      const expectedVal1 = {
        prop: 'non-empty-1',
      };
      const expectedVal2 = {
        prop: 'non-empty-3',
      };
      expect(conditionalVal1).toEqual(expectedVal1);
      expect(conditionalVal2).toEqual(expectedVal2);
    });

    it('does delimited mapping correctly', () => {
      const delimited = {
        stringThing: 'a, b,, c',
      };

      const delimitedRules: IRules = {
        vectorThing: (r) => {
          const val = r.get('stringThing');
          if (val) {
            return val
              .split(',')
              .filter((v: string) => !!v.length)
              .map((v: string) => v.trim().toUpperCase());
          }
          return '';
        },
      };

      const delimitedVal = Tform.transform(delimitedRules, delimited);
      const expectedVal = {
        vectorThing: ['A', 'B', 'C'],
      };
      expect(delimitedVal).toEqual(expectedVal);
    });
  });
});
