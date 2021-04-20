import path from "path";
import { promises } from "fs";

import { Config } from "../lib/config";
import { runCommand } from "../util/node/run-command";
import { Context } from "../lib/context";
import { Episode } from "../lib/episode";

const { readdir } = promises;

export type AudioStream = {
  fileName: string;
  format: string;
  bitrate: string;
  delay: number;
  index: number;
  type: string;
};
export type DgIndexFiles = {
  audioStreams: AudioStream[];
  d2vIndex: string;
};

enum IDCTAlgorithm {
  MMX = 1,
  SSEMUX = 2,
  SSE2MMX = 3,
  x64Bit = 4,
  IEE1080 = 5,
  SkalMMX = 6,
  SimpleMMX = 7,
}

enum OutputMethod {
  None = 0,
  DemuxTracks = 1,
  DemuxAllTracks = 2,
  DecodeAc3ToWav = 3,
}

enum FieldOperation {
  HonorPulldownFlags = 0,
  ForceFilm = 1,
  IgnorePulldownFlags = 2,
}

export type DgIndexOptions = {
  idctAlgorithm?: IDCTAlgorithm;
  fieldOperation?: FieldOperation;
  outputMethod?: OutputMethod;
  hide?: boolean;
  exit?: boolean;
};

export class DgIndex {
  idctAlgorithm?: IDCTAlgorithm;
  fieldOperation?: FieldOperation;
  outputMethod: OutputMethod;
  hide?: boolean;
  exit?: boolean;
  constructor(private config: Config, options: DgIndexOptions = {}) {
    this.outputMethod = options.outputMethod ?? OutputMethod.DemuxAllTracks;
    this.fieldOperation = options.fieldOperation;
    this.idctAlgorithm = options.idctAlgorithm;
    this.hide = options.hide;
    this.exit = options.exit;
  }
  async run(options: { sourceFile: string; outputRoot: string }): Promise<void> {
    const { config } = this;
    const { sourceFile, outputRoot } = options;
    const args: string[] = [];
    if (this.idctAlgorithm !== undefined) {
      args.push("-ia", String(this.idctAlgorithm));
    }
    if (this.fieldOperation !== undefined) {
      args.push("-fo", String(this.fieldOperation));
    }
    if (this.hide) {
      args.push("-hide");
    }
    if (this.exit) {
      args.push("-exit");
    }

    args.push("-om", String(this.outputMethod));
    args.push("-i", sourceFile);
    args.push("-o", outputRoot);

    await runCommand(config.dgindex, args);
  }
}

const audioStreamRegex = /^dgindex T(\d+) (.+) (.+) DELAY (\d+)ms\.(.*)$/;
function parseAudioStreams(fileNames: string[]): AudioStream[] {
  return fileNames.map(fileName => {
    const match = fileName.match(audioStreamRegex);
    if (!match) {
      throw new Error(`Unable to parse dginidex output filename "${fileName}`);
    }
    const stream: AudioStream = {
      fileName,
      index: Number(match[1]),
      format: match[2],
      bitrate: match[3],
      delay: Number(match[4]),
      type: match[5],
    };
    return stream;
  });
}

async function parseDgIndexOutput(dir: string): Promise<DgIndexFiles> {
  const files = await readdir(dir);
  const out: DgIndexFiles = {
    audioStreams: [],
    d2vIndex: "",
  };

  const audioStreamFiles: string[] = [];

  files
    .filter(e => e.startsWith("dgindex"))
    .forEach(file => {
      const extname = path.extname(file).toLowerCase();
      if (/ DELAY /.test(file)) {
        audioStreamFiles.push(file);
        return;
      }
      switch (extname) {
        case ".d2v":
          out.d2vIndex = file;
          break;
        default:
          throw new Error(`Don't know what to do with file ${file} emitted by dgindex`);
      }
    });
  out.audioStreams = parseAudioStreams(audioStreamFiles);
  return out;
}

export async function generateDgIndex(context: Context, episode: Episode) {
  const { logger } = context;
  const dgindex = new DgIndex(context.config, {
    exit: true,
    hide: true,
    idctAlgorithm: IDCTAlgorithm.IEE1080,
    fieldOperation: FieldOperation.HonorPulldownFlags,
    outputMethod: OutputMethod.DemuxAllTracks,
  });

  const files = episode.getFileNames();
  const workDir = episode.getWorkDir();
  const dgIndexRootPath = `${workDir}/dgindex`;
  logger.info(`Indexing "${files.vob}"...`);
  await dgindex.run({
    sourceFile: `${episode.getWorkDir()}/${files.vob}`,
    outputRoot: dgIndexRootPath,
  });

  const outfiles = await parseDgIndexOutput(workDir);
  console.log(outfiles);
}

export async function getDgIndexDataForEpisode(episode: Episode): Promise<DgIndexFiles> {
  return parseDgIndexOutput(episode.getWorkDir());
}
