// Copyright (C) 2018 Rimeto, LLC. All Rights Reserved.

export function splitList(delimiter: string, value: string): string[] {
  return value
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function wrapList(obj: any) {
  return obj ? [obj] : [];
}
