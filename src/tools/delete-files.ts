import path from "path";
import { promises } from "fs";
import minimatch from "minimatch";
import { Episode } from "../lib/episode";

const { rm, readdir, stat } = promises;
const rootPath = process.argv[2];
const imageDir = process.argv[3];

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

export async function deleteFilesForPattern(dir: string, pat: string) {
  const files = (await readdir(dir)) || [];
  const matches = files.filter(file => minimatch(file, pat, minimatchOpts));
  if (!matches.length) {
    console.log(`No matches for "${dir}/${pat}"`);
    return;
  }

  console.log(`Deleting ${matches.length} files matching "${dir}}/${pat}"`);
  for (const file of matches) {
    await rm(`${dir}/${file}`);
  }
}

async function deleteFile(file: string) {
  const dir = path.dirname(file);
  const pat = path.basename(file);
  await deleteFilesForPattern(dir, pat);
}

export async function deleteProjectFiles(episode: Episode) {
  const workDir = episode.getWorkDir();
  const files = episode.getFileNames();
  const indexFiles = await episode.getDgIndexFiles();
  await deleteDir(`${workDir}/${files.veaiImageDir}`);
  await deleteFile(`${workDir}/${indexFiles.d2vIndex}`);
  throw new Error("not done yet");
  await deleteFile(`${rootPath}*.log`);
  await deleteFile(`${rootPath}*.txt`);
  await deleteFile(`${rootPath}*.d2v`);
  await deleteFile(`${rootPath}*.m2v`);
  await deleteFile(`${rootPath}*.mkv`);
  await deleteDir(imageDir);
}
