/**
 * Like Object.assign, but ignores properties with "undefined" values.
 */
export function assignDefined<T extends { [key: string]: any }>(
  target: T,
  ...sources: Array<Partial<Required<T>>>
): T {
  sources.forEach(source => {
    Object.entries(source).forEach(([key, value]: [keyof T, T[keyof T]]) => {
      if (value !== undefined) {
        target[key] = value;
      }
    });
  });
  return target;
}
