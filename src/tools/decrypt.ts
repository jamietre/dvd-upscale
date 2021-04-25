import path from "path";
import { promises } from "fs";

import { Config } from "../lib/config";
import { Context } from "../lib/context";
import { TempDir } from "../util/node/tempdir";
import { Episode } from "../lib/episode";
import { container, injectable } from "tsyringe";
import { CommandRunner } from "../util/node/command-runner";

const { readdir, rename } = promises;

export type DvdDecrypterFiles = {
  ifoFile: string;
  vobFile: string;
  chapterFile: string;
};

export type DvdDecrypterOptions = {
  driveLetter: string;
  vts: number;
  pgc: number;
  outputDir: string;
};

@injectable()
export class DvdDecrypter {
  readonly mode = "IFO";
  constructor(private config: Config, private commandRunner: CommandRunner) {}
  async run(options: DvdDecrypterOptions): Promise<void> {
    const { config } = this;
    const args: string[] = [];

    args.push("/MODE", "IFO");
    args.push("/SRC", formatDriveLetter(options.driveLetter));
    args.push("/DEST", options.outputDir);
    args.push("/VTS", String(options.vts));
    args.push("/PGC", String(options.pgc));
    args.push("/SPLIT", "NONE");
    args.push("/START");
    args.push("/CLOSE");

    await this.commandRunner.run(config.dvdDecrypter, args);
  }
}

export async function decryptDvd(options: {
  context: Context;
  driveLetter: string;
  season: number;
  disc: number;
}): Promise<void> {
  const { context, season, disc, driveLetter } = options;
  const { profile, logger } = context;
  const episodes = profile.episodes;
  const toExtract = Object.values(episodes).filter(
    episode => episode.season === season && episode.disc === disc
  );

  if (toExtract.length === 0) {
    throw new Error(
      `There are no episodes for Season ${season}, Disc ${disc} - check your configuration for this project.`
    );
  }
  const dd = container.resolve(DvdDecrypter);

  for await (const item of toExtract) {
    const episode = profile.getEpisode(item);
    const workDir = await episode.ensureWorkDir();
    const ddDir = `${workDir}/dvddecrypter.tmp`;
    const tmpDir = TempDir.fromDir(ddDir);
    await tmpDir.create();
    logger.info(`Processing vts${item.vts}, pgc${item.pgc} as "${episode.getBaseFileName()}"`);

    let files: DvdDecrypterFiles | undefined;
    // use existing files if they are there from a prior attempt
    try {
      files = await getDecryptedFiles(tmpDir.path);
    } catch (e) {
      await dd.run({
        driveLetter,
        outputDir: tmpDir.path,
        pgc: item.pgc,
        vts: item.vts,
      });
      files = await getDecryptedFiles(tmpDir.path);
    }
    await copyFilesToProject(files, episode);
    await tmpDir.delete();
  }
}

async function getDecryptedFiles(dir: string): Promise<DvdDecrypterFiles> {
  const files = await readdir(dir);
  const out: DvdDecrypterFiles = {} as DvdDecrypterFiles;
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    switch (ext) {
      case ".vob":
        out.vobFile = `${dir}/${file}`;
        break;
      case ".ifo":
        out.ifoFile = `${dir}/${file}`;
        break;
      case ".txt":
        out.chapterFile = `${dir}/${file}`;
        break;
      default:
        throw new Error(`"${file}" was not an expected output file from DVD Decrypter`);
    }
  });
  if (!out.chapterFile || !out.ifoFile || !out.vobFile) {
    throw new Error(`Did not obtain all files expected from dvddecrypter in "${dir}"`);
  }
  return out;
}

async function copyFilesToProject(files: DvdDecrypterFiles, episode: Episode) {
  const targetDir = episode.getWorkDir();
  const fileNames = episode.getFileNames();
  await rename(files.ifoFile, `${targetDir}/${fileNames.ifo}`);
  await rename(files.vobFile, `${targetDir}/${fileNames.vob}`);
  await rename(files.chapterFile, `${targetDir}/${fileNames.chapters}`);
}

function formatDriveLetter(driveLetter: string): string {
  return driveLetter.slice(0, 1) + ":";
}
