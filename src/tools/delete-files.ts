import path from "path";
import { promises } from "fs";
import minimatch from "minimatch";
import { Episode } from "../lib/episode";

const { rm, readdir } = promises;

const minimatchOpts = { nocase: true };

// export async function deleteDir(dir: string) {
//   try {
//     await stat(dir);
//   } catch (e) {
//     if (/ENOENT/.test(e.message)) {
//       console.log(`Directory "${dir}" doesn't exist.`);
//       return;
//     }
//     throw e;
//   }
//   console.log(`Deleting directory ${dir}...`);
//   await rm(`${dir}`, {
//     recursive: true,
//   });
// }

export async function deleteFilesForPattern(dir: string, pat: string, recursive: boolean) {
  const files = (await readdir(dir)) || [];
  const matches = files.filter(file => minimatch(file, pat, minimatchOpts));
  if (!matches.length) {
    console.log(`No matches for "${dir}/${pat}"`);
    return;
  }

  console.log(`Deleting ${matches.length} files matching "${dir}/${pat}"`);
  for (const file of matches) {
    await rm(`${dir}/${file}`, { recursive });
  }
}

async function deleteFile(file: string) {
  const dir = path.dirname(file);
  const pat = path.basename(file);
  await deleteFilesForPattern(dir, pat, false);
}

async function deleteDir(file: string) {
  const dir = path.dirname(file);
  const pat = path.basename(file);
  await deleteFilesForPattern(dir, pat, true);
}

export async function deleteProjectFiles(episode: Episode) {
  const workDir = episode.getWorkDir();
  const files = episode.getFileNames();
  const indexFiles = await episode.getDgIndexFiles();

  if (indexFiles.d2vIndex) {
    await deleteFile(`${workDir}/${indexFiles.d2vIndex}`);
  }
  for await (const file of indexFiles.audioStreams) {
    await deleteFile(`${workDir}/${file}`);
  }

  await deleteFile(`${workDir}/*.log`);
  await deleteFile(`${workDir}/*.tmp.*.txt`);
  await deleteFile(`${workDir}/*${files.timecodeMetrics}`);
  await deleteFile(`${workDir}/${files.deinterlacedAvi}`);
  await deleteDir(`${workDir}/${files.rawEncodedFile}`);
  await deleteFile(`${workDir}/avisynth-tmp-*`);
  await deleteDir(`${workDir}/${files.veaiImageDir}`);
}
