export type UnknownObject = Record<string, unknown>;

export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

export function assertIsDefined<T>(value: T | undefined, msg?: string): asserts value is T {
  if (!value) {
    throw new Error(msg ?? "The value must be defined");
  }
}
