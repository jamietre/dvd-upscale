import { v4 as uuid } from "uuid";
import { promises } from "fs";
import { existsDirectory } from "./fs-helpers";

const { mkdir, rm } = promises;

export class TempDir {
  static createInDir(parent: string, prefix?: string): Required<TempDir> {
    const tmpDirUuid = uuid();
    const dirName = prefix ? `${prefix}-${tmpDirUuid}` : tmpDirUuid;
    const tmpdir = `${parent}/${dirName}`;
    return new TempDir(tmpdir);
  }
  static fromDir(dir: string) {
    return new TempDir(dir);
  }
  readonly path: string;
  constructor(path: string) {
    this.path = path;
  }
  /**
   * Ensure the temporary directory exists. If the parent doesn't exist, will fail.
   */
  async create(): Promise<void> {
    if (await existsDirectory(this.path)) {
      return;
    }
    await mkdir(this.path, { recursive: false });
  }

  /**
   * Delete the temporary directory recursively
   */
  async delete(): Promise<void> {
    await rm(this.path, {
      recursive: true,
    });
  }
}
