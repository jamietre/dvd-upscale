import { injectable, container } from "tsyringe";
import path from "path";
import { promises } from "fs";

import { Config } from "../lib/config";
import { CommandRunner } from "../util/node/command-runner";
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

type DgIndexOptionsOptional = {
  idctAlgorithm?: IDCTAlgorithm;
  fieldOperation?: FieldOperation;
  outputMethod?: OutputMethod;
  hide?: boolean;
  exit?: boolean;
};

export type DgIndexOptions = DgIndexOptionsOptional & {
  sourceFile: string;
  outputRoot: string;
};

@injectable()
export class DgIndex {
  private static defaultOptions: DgIndexOptionsOptional = {
    idctAlgorithm: IDCTAlgorithm.IEE1080,
    fieldOperation: FieldOperation.HonorPulldownFlags,
    outputMethod: OutputMethod.DemuxAllTracks,
    hide: true,
    exit: true,
  };
  constructor(private config: Config, private commandRunner: CommandRunner) {}
  private getArgs(options: DgIndexOptions): string[] {
    options = {
      ...DgIndex.defaultOptions,
      ...options,
    };
    const args: string[] = [];
    if (options.idctAlgorithm !== undefined) {
      args.push("-ia", String(options.idctAlgorithm));
    }
    if (options.fieldOperation !== undefined) {
      args.push("-fo", String(options.fieldOperation));
    }
    if (options.hide) {
      args.push("-hide");
    }
    if (options.exit) {
      args.push("-exit");
    }

    args.push("-om", String(options.outputMethod));
    args.push("-i", options.sourceFile);
    args.push("-o", options.outputRoot);
    return args;
  }
  async run(options: DgIndexOptions): Promise<void> {
    const { config, commandRunner } = this;
    const args = this.getArgs(options);
    await commandRunner.run(config.dgindex, args);
  }
}

const audioStreamRegex = /dgindex T(\d+) (.+) (.+) DELAY (\d+)ms\.(.*)$/;
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
    .filter(e => e.includes(".dgindex"))
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

export async function generateDgIndex(episode: Episode): Promise<void> {
  const context = container.resolve(Context);
  const dgindex = container.resolve(DgIndex);
  const { logger } = context;

  const options = {
    exit: true,
    hide: true,
    idctAlgorithm: IDCTAlgorithm.IEE1080,
    fieldOperation: FieldOperation.HonorPulldownFlags,
    outputMethod: OutputMethod.DemuxAllTracks,
  };

  const files = episode.getFileNames();
  const workDir = episode.getWorkDir();
  const dgIndexRootPath = `${workDir}/${episode.getBaseFileName()}.dgindex`;

  logger.info(`Indexing "${files.vob}"...`);
  await dgindex.run({
    sourceFile: `${episode.getWorkDir()}/${files.vob}`,
    outputRoot: dgIndexRootPath,
    ...options,
  });

  const outfiles = await parseDgIndexOutput(workDir);
  logger.info(`Finished; extracted d2v + ${outfiles.audioStreams.length} audio streams`);
}

export async function getDgIndexDataForEpisode(episode: Episode): Promise<DgIndexFiles> {
  return parseDgIndexOutput(episode.getWorkDir());
}
