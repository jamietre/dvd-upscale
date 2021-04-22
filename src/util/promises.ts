/**
 * Promise that resolves after the specified time
 */
export async function wait(timeMilliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeMilliseconds);
  });
}

export function isPromise<T>(obj?: Record<string, unknown> | Promise<T>): obj is Promise<T> {
  return !!(
    obj &&
    obj.then &&
    typeof obj.then === "function" &&
    obj.catch &&
    typeof obj.catch === "function"
  );
}

/**
 * make a promise, and provide the resolve/reject functions
 */
export function createDeferred<T = unknown>(): {
  promise: () => Promise<T>;
  resolve: (value?: T) => void;
  reject: (reason?: Error) => void;
} {
  let resolve!: (value?: T) => void;
  let reject!: (reason?: Error) => void | undefined;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve as (value?: T) => void;
    reject = _reject;
  });

  return {
    promise: async () => promise,
    resolve,
    reject,
  };
}
