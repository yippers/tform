// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

import * as _ from 'lodash';
import * as vm from 'vm';

export function evalInContext(code: string, context: any = {}, opts: any = {}) {
  const sandbox: any = {};
  if (context) {
    Object.keys(context).forEach((key) => {
      sandbox[key] = context[key];
    });
  }

  const resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000);
  code = `${resultKey} = (${code})`; // parenthesis are necessary to interpret object literals
  sandbox[resultKey] = {};

  vm.runInNewContext(code, sandbox, opts);
  return sandbox[resultKey];
}

export function deserialize(rawRules: string, dependencies: string[] = []): any {
  let context: any = {};

  dependencies.forEach((path) => {
    path = path.trim();
    if (path) {
      const module = require(`${path}`); // require needs string literal, not expression
      context = _.extend(context, module);
    }
  });

  return evalInContext(rawRules, context);
}
