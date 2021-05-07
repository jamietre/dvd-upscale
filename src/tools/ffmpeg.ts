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
import { mkdirp } from "../util/node/fs-helpers";
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

type VideoFormat = "yuv420p101e";
type SubtitleDisposition = "infer_no_subs";

export type Map = {
  input: InputFile;
  streamIndex: number | "all";
};

export type InputFile = {
  inputPath: string;
  inputIndex: number;
  threadQueueSize?: number;
  inputFormat?: "avi";
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
      format?: VideoFormat;
      aspect?: Aspect;
    }
  | {
      type: "s";
      codec: SubtitleEncoder;
      disposition?: SubtitleDisposition;
    };

type OutputFile = {
  stream: OutputStream;
  map?: Map;
};

type GlobalOptions = {
  maxInterleaveDelta?: number;
  /**
   * Replace existing file; default is true
   */
  overwriteExisting?: boolean;
  vsync?: "auto" | "passthrough" | "cfr" | "vfr" | "drop";
};

@injectable()
export class FFMpeg {
  private outputs: OutputFile[] = [];
  private inputs: InputFile[] = [];
  private globalOptions: GlobalOptions;

  constructor(private config: Config, private commandRunner: CommandRunner) {
    this.globalOptions = this.getDefaultGlobalOptions();
  }
  createInput(inputPath: string) {
    const inputStream: InputFile = {
      inputIndex: this.inputs.length,
      inputPath,
    };
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
    };
    return options;
  }
  getArgs(outputFile?: string): string[] {
    const args: string[] = [];
    this.inputs.forEach(input => {
      args.push("-i", input.inputPath);
      if (input.threadQueueSize !== undefined) {
        args.push("-thread_queue_size", String(input.threadQueueSize));
      }
      if (input.inputFormat !== undefined) {
        args.push("-f", input.inputFormat);
      }
    });

    this.outputs.forEach(stream => {
      const { stream: output, map } = stream;

      const { codec, type } = output;

      if (map) {
        const mapArgValue = getStreamSpecifier(type, map.input.inputIndex, map.streamIndex);
        args.push("-map", mapArgValue);
      }
      const codecArg = `-c:${type}`;
      const codecArgValue = `${codec.name}`;
      args.push(codecArg, codecArgValue);
      args.push(...getEncoderArgs(codec));

      switch (output.type) {
        case "v":
          if (output.format) {
            args.push("-vf", `format=${output.format}`);
          }
          if (output.aspect) {
            args.push("-aspect", output.aspect);
          }

          break;
        case "s":
          if (map && output.disposition) {
            args.push(`-disposition:s:${map.streamIndex}`, output.disposition);
          }
          break;
        case "a":
          break;
        default:
          assertNever(output);
      }
    });

    this.addGlobalOptions(args);

    if (outputFile) {
      args.push(outputFile);
    }
    return args;
  }

  async run(outputFile?: string): Promise<void> {
    const { config } = this;
    if (outputFile) {
      const outputRoot = path.dirname(outputFile);
      await mkdirp(outputRoot);
    }

    const args = this.getArgs(outputFile);
    args.push("-loglevel", "quiet", "-stats");

    await this.commandRunner.run(config.ffmpeg, args, {
      logReader: message => process.stdout.write(message),
    });
  }

  private addGlobalOptions(args: string[]) {
    const { globalOptions } = this;
    if (globalOptions.maxInterleaveDelta) {
      args.push("-max_interleave_delta");
    }
    if (globalOptions.vsync) {
      args.push("-vsync", globalOptions.vsync);
    }
    if (globalOptions.overwriteExisting) {
      args.push("-y");
    }
  }

  // private validateOptions() {
  //   this.outputStreams.forEach((stream, index) => {
  //     if (
  //       stream.map.inputIndex > this.inputs.length ||
  //       stream.map.inputIndex < 0
  //     ) {
  //       throw new Error(
  //         `Pipeline ${index} map refers to input index ${stream.map.inputIndex} which is invalid.`
  //       );
  //     }
  //   });
  // }
}

// function getCodecOptions(type: StreamType, codec: Encoder): string[] {
//   const args: string[] = [];
//   args.push(get);
// }

function getStreamSpecifier(
  streamType: StreamType,
  inputIndex: number,
  streamIndex: number | "all"
): string {
  let spec = `${inputIndex}:${streamType}`;

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
