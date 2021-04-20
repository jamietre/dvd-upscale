import { promises } from "fs";
import { assertDirectoryExists } from "../assert";
const { mkdir } = promises;

export async function mkdirp(dir: string): Promise<void> {
  if (await existsDirectory(dir)) {
    return;
  }
  await mkdir(dir, { recursive: true });
}

export async function existsDirectory(fname: string): Promise<boolean> {
  try {
    await assertDirectoryExists(fname);
    return true;
  } catch (e) {
    return false;
  }
}
