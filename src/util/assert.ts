import { promises } from "fs";
import { Stats } from "node:fs";

const { stat } = promises;

export function assertIncludes<T>(
  arr: T[] | readonly T[],
  obj: unknown | T,
  description?: string
): asserts obj is T {
  if (!arr.includes(obj as T)) {
    throw new Error(`"${obj}" is not a valid ${description}`);
  }
}

export async function assertFileExists(fname: string): Promise<void> {
  try {
    const fstat = await stat(fname);
    if (fstat.isDirectory()) {
      throw new Error(`"${fname}" is a directory.`);
    }
  } catch (e) {
    const err = e as Error;
    if (/ENOENT/.test(err.message)) {
      throw new Error(`File "${fname}" does not exist.`);
    }
    throw new Error(err.message);
  }
}

export async function assertDirectoryExists(fname: string): Promise<void> {
  let fstat: Stats;
  try {
    fstat = await stat(fname);
  } catch (e) {
    const err = e as Error;
    if (/ENOENT/.test(err.message)) {
      const newError = new Error(`File "${fname}" does not exist.`);
      throw newError;
    }
    throw new Error(err.message);
  }
  if (!fstat.isDirectory()) {
    throw new Error(`"${fname}" is a file.`);
  }
}
