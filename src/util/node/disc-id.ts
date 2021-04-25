import crypto from "crypto";
import { createReadStream, promises, Stats } from "fs";
import { parseDrive } from "./fs-helpers";

const { stat, readdir } = promises;

export class DiscIdentifier {
  /**
   * Produce a hash based on the un
   */
  async getDdvdHash(driveLetter: string): Promise<string> {
    const drive = parseDrive(driveLetter);
    const dir = `${drive}VIDEO_TS`;
    const files = await readdir(dir);
    const toHash: string[] = [];
    for await (const file of files) {
      const stats = await stat(`${dir}/${file}`);
      toHash.push(JSON.stringify(getStats(file, stats)));
    }
    const hash = crypto.createHash("sha1").update(toHash.join(",")).digest("hex");
    return hash;
  }
}

function getStats(name: string, stats: Stats) {
  const { size, ino, birthtime } = stats;
  return {
    name,
    size,
    ino,
    birthtime: birthtime.valueOf(),
  };
}

export async function getFileHash(filePath: string): Promise<string> {
  return new Promise(resolve => {
    // the file you want to get the hash
    const fd = createReadStream(filePath);
    const hash = crypto.createHash("sha1");
    hash.setEncoding("hex");
    hash.on("finish", () => resolve(hash.read()));
    fd.pipe(hash);
  });
}
