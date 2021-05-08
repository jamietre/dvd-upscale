// INPUTS
// -framerate "$target_framerate" \
// -i "$image_dir/%06d.png" \
//  -thread_queue_size 512 \
// -i "$source_file" \
//  -max_interleave_delta 0 \

// OUTPUTS
// -vf format=yuv420p10le \
// -map 0:v:0 \
// -c:v libx265 \
// -crf 20 \
// -profile:v main10 \
// -preset slower \

// -map 1:a? \
// -c:a copy \

// -map 1:s? \
// -c:s copy \
// -disposition:s:0 0 \
// -default_mode infer_no_subs \

// -vsync 2 \
// -y \
// "$out"

import path from "path";
import { injectable } from "tsyringe";

import { Config } from "../lib/config";
import { CommandRunner } from "../util/node/command-runner";
import { Fs } from "../util/node/fs";
import { assertNever } from "../util/types";

export type StreamType = "a" | "v" | "s";

export type Libx265Preset = "veryfast" | "fast" | "medium" | "slow" | "slower" | "veryslow";

interface Encoder {
  name: string;
}

export type EncoderLibx265 = Encoder & {
  name: "libx265";
  crf?: number;
  profile?: "main10";
  preset: Libx265Preset;
};

export type EncoderHuffYuv = Encoder & {
  name: "huffyuv";
};

type EncoderCopy = Encoder & {
  name: "copy";
};

type VideoEncoder = EncoderCopy | EncoderLibx265 | EncoderHuffYuv;
type AudioEncoder = EncoderCopy;
type SubtitleEncoder = EncoderCopy;

export type StreamSpecifier<T> = T & {
  streamIndex: number | "all";
};

export type InputFile = {
  inputPath: string;
  inputIndex: number;
  inputFormat?: "avi";
  options?: InputOptions;
};

export const framerates = ["25", "30", "24000/1001", "30000/1001"] as const;
export type Framerate = typeof framerates[number];

export type VideoFilters = { format?: "yuv420p10le" };

export type InputOptions = {
  threadQueueSize?: number;
  framerate?: Framerate;
};

export type Aspect = "4:3" | "16:9";

export type OutputStream =
  | {
      type: "a";
      codec: AudioEncoder;
    }
  | {
      type: "v";
      codec: VideoEncoder;
      aspect?: Aspect;
      filters?: VideoFilters;
    }
  | {
      type: "s";
      codec: SubtitleEncoder;
    };

type OutputFile = {
  stream: OutputStream;
  map?: StreamSpecifier<{
    input: InputFile;
  }>;
  disposition?: StreamSpecifier<{
    input: InputFile;
    disposition: Disposition;
  }>;
};

export type Disposition =
  | "0"
  | "default"
  | "dub"
  | "original"
  | "comment"
  | "lyrics"
  | "karaoke"
  | "forced"
  | "hearing_impaired"
  | "visual_impaired"
  | "lean_effects"
  | "attached_pic"
  | "captions"
  | "descriptions"
  | "dependent"
  | "metadata";

type GlobalOptions = {
  outputFile?: string;
  maxInterleaveDelta?: number;
  /**
   * Replace existing file; default is true
   */
  overwriteExisting?: boolean;
  vsync?: "auto" | "passthrough" | "cfr" | "vfr" | "drop";
  /**
   * Default mode for the muxer
   * https://ffmpeg.org/ffmpeg-formats.html#Options-10
   */
  defaultMode?: "ifer" | "infer_no_subs" | "passthrough";

  logLevel?:
    | "quiet"
    | "panic"
    | "fatal"
    | "error"
    | "warning"
    | "info"
    | "verbose"
    | "debug"
    | "trace";
  stats?: boolean;
};

@injectable()
export class FFMpeg {
  private outputs: OutputFile[] = [];
  private inputs: InputFile[] = [];
  private globalOptions: GlobalOptions;

  constructor(private config: Config, private commandRunner: CommandRunner, private fs: Fs) {
    this.globalOptions = this.getDefaultGlobalOptions();
  }
  createInput(inputPath: string, options?: InputOptions) {
    const inputStream: InputFile = {
      inputIndex: this.inputs.length,
      inputPath,
    };
    if (options) {
      inputStream.options = options;
    }
    this.inputs.push(inputStream);
    return inputStream;
  }

  createOutput(output: OutputFile) {
    this.outputs.push(output);
  }

  /**
   * Merge global options.
   */
  setGlobalOptions(options: GlobalOptions) {
    Object.assign(this.globalOptions, options);
  }
  resetGlobalOptions() {
    this.globalOptions = this.getDefaultGlobalOptions();
  }
  getDefaultGlobalOptions(): GlobalOptions {
    const options: GlobalOptions = {
      overwriteExisting: true,
      logLevel: "error",
      stats: true,
    };
    return options;
  }
  getArgs(): string[] {
    const args: string[] = [];
    this.inputs.forEach(input => {
      const inputOptions = input.options;
      if (inputOptions) {
        if (inputOptions.threadQueueSize !== undefined) {
          args.push("-thread_queue_size", String(inputOptions.threadQueueSize));
        }
        if (inputOptions.framerate) {
          args.push("-framerate", inputOptions.framerate);
        }
      }
      args.push("-i", input.inputPath);
      if (input.inputFormat !== undefined) {
        args.push("-f", input.inputFormat);
      }
    });

    this.outputs.forEach(stream => {
      const { stream: output, map, disposition } = stream;

      const { codec, type } = output;

      if (map) {
        const streamSpec = getStreamSpecifier(type, map.streamIndex);
        args.push("-map", `${map.input.inputIndex}:${streamSpec}`);
      }
      if (disposition) {
        const streamSpec = getStreamSpecifier(type, disposition.streamIndex);
        args.push(`-disposition:${streamSpec}`, disposition.disposition);
      }
      const codecArg = `-c:${type}`;
      const codecArgValue = `${codec.name}`;
      args.push(codecArg, codecArgValue);
      args.push(...getEncoderArgs(codec));

      switch (output.type) {
        case "v": {
          if (output.aspect) {
            args.push("-aspect", output.aspect);
          }
          const filters = output?.filters;
          if (filters?.format) {
            args.push("-vf", `format=${filters.format}`);
          }

          break;
        }
        case "s":
          break;
        case "a":
          break;
        default:
          assertNever(output);
      }
    });

    this.addGlobalOptions(args);
    return args;
  }

  async run(options: { showCommand?: boolean } = {}): Promise<void> {
    const { config, fs } = this;
    const args = this.getArgs();

    const { outputFile } = this.globalOptions;
    if (outputFile) {
      const outputRoot = path.dirname(outputFile);
      await fs.mkdirp(outputRoot);
    }

    await this.commandRunner.run(config.ffmpeg, args, {
      showCommand: options.showCommand,
    });
  }

  private addGlobalOptions(args: string[]) {
    const { globalOptions } = this;
    if (globalOptions.defaultMode) {
      args.push("-default_mode", globalOptions.defaultMode);
    }

    if (globalOptions.maxInterleaveDelta != null) {
      args.push("-max_interleave_delta", String(globalOptions.maxInterleaveDelta));
    }
    if (globalOptions.vsync) {
      args.push("-vsync", globalOptions.vsync);
    }
    if (globalOptions.logLevel) {
      args.push("-loglevel", globalOptions.logLevel);
    }
    if (globalOptions.stats) {
      args.push("-stats");
    }
    if (globalOptions.overwriteExisting) {
      args.push("-y");
    }

    if (globalOptions.outputFile) {
      args.push(globalOptions.outputFile);
    }
  }
}

function getStreamSpecifier(streamType: StreamType, streamIndex: number | "all"): string {
  let spec = `${streamType}`;

  if (streamIndex === "all") {
    spec = `${spec}?`;
  } else {
    spec = `${spec}:${streamIndex}`;
  }

  return spec;
}

function getEncoderArgs(encoder: VideoEncoder | AudioEncoder): string[] {
  const args: string[] = [];
  switch (encoder.name) {
    case "copy":
      break;
    case "libx265": {
      if (encoder.crf) {
        args.push("-crf", String(encoder.crf));
      }
      if (encoder.profile) {
        const argName = `-profile:v`;
        args.push(argName, encoder.profile);
      }
      if (encoder.preset) {
        args.push("-preset", encoder.preset);
      }
    }
  }
  return args;
}
