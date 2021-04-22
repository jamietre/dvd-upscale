import { promises } from "fs";
import minimatch from "minimatch";

const { rm, readdir, stat } = promises;

const minimatchOpts = { nocase: true };

export async function deleteDir(dir: string) {
  try {
    await stat(dir);
  } catch (e) {
    if (/ENOENT/.test(e.message)) {
      console.log(`Directory "${dir}" doesn't exist.`);
      return;
    }
    throw e;
  }
  console.log(`Deleting directory ${dir}...`);
  await rm(`${dir}`, {
    recursive: true,
  });
}

/**
 * Delete everything in a directory matching a glob
 */
export async function deleteFilesForPattern(dir: string, pat: string) {
  const files = (await readdir(dir)) || [];
  const matches = files.filter(file => minimatch(file, pat, minimatchOpts));
  if (!matches.length) {
    console.log(`No matches for "${dir}/${pat}"`);
    return;
  }

  console.log(`Deleting ${matches.length} files matching "${dir}}/${pat}"`);
  for (const file of matches) {
    await rm(`${dir}/${file}`, { recursive: true });
  }
}
