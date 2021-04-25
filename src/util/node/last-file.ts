import path from "path";
import { promises } from "fs";
import { existsDirectory } from "./fs-helpers";

const { readdir } = promises;

/**
 * Given a directory that's assumed to be populated with files having only a number for a name,
 * e.g. 000001.PNG, find the highest number, and fail if there are gaps.
 *
 * TODO: Don't fail on gaps but return them, and write code to fill in the holes with VEAI
 */
export async function getLastFile(dir: string) {
  const exists = await existsDirectory(dir);
  if (!exists) {
    throw new Error(`The directory "${dir}" doesn't exist.`);
  }
  const files = await readdir(dir);

  if (!files.length) {
    return undefined;
  }

  files.sort();
  let lastNumber: number | undefined;
  const gaps: string[] = [];
  files.forEach(file => {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const fileNum = Number(base);
    if (Number.isNaN(fileNum)) {
      throw new Error(`Invalid file name ${file}`);
    }
    if (lastNumber) {
      if (fileNum !== lastNumber + 1) {
        gaps.push(`Gap detected between ${lastNumber} and ${fileNum}`);
      }
    }
    lastNumber = fileNum;
  });

  if (gaps.length) {
    throw new Error("Gaps were found in file sequence, aborting.\n" + gaps.join("\n"));
  }
  return lastNumber;
}
