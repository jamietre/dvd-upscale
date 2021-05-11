import { mkdir } from "fs/promises";
import { container } from "../util/di";
import { injectable } from "tsyringe";
import { Config } from "../lib/config";
import { CommandRunner } from "../util/node/command-runner";
import { Profile } from "../lib/profile";
import { Episode } from "../lib/episode";
import { existsDirectory } from "../util/node/fs-helpers";
import { getLastFile } from "../util/node/last-file";

export const aiModels = ["ghq-5", "amq-12", "amq-13", "ddv-2"] as const;
export type AiModel = typeof aiModels[number];

export const imageFormats = ["jpg", "png", "16tif", "8tif"] as const;
export type ImageFormats = typeof imageFormats[number];

export type VeaiOptionsCommon = {
  outputFormat: ImageFormats;
  beginFrame?: number;
  dimensions?: { width: number; height: number };
  height?: number;
  grainSize?: number;
  grainAmount?: number;
  aiModel: AiModel;
};

export type VeaiOptionsOptional = VeaiOptionsCommon;

type VeaiOptions = VeaiOptionsOptional & {
  inputFile: string;
  outputDir: string;
};

@injectable()
export class Veai {
  constructor(private config: Config, private commandRunner: CommandRunner) {}
  private getArgs(options: VeaiOptions): string[] {
    const args: string[] = [];

    args.push("--input", String(options.inputFile));
    args.push("--output", String(options.outputDir));
    args.push("-f", options.outputFormat);
    args.push("-m", options.aiModel);
    if (options.beginFrame !== undefined) {
      args.push("--begin-frame", String(options.beginFrame));
    }

    if (options.dimensions !== undefined) {
      args.push("--width:height", `${options.dimensions.width}:${options.dimensions.height}`);
    }
    if (options.grainSize !== undefined) {
      args.push("--grain-size", String(options.grainSize));
    }
    if (options.grainAmount !== undefined) {
      args.push("--grain-amount", String(options.grainAmount));
    }

    return args;
  }
  async run(options: VeaiOptions): Promise<void> {
    const { config, commandRunner } = this;
    const args = this.getArgs(options);

    await commandRunner.run(config.veai, args, {
      logReader: message => process.stdout.write(message),
    });
  }
}

export async function upscaleVeai(episode: Episode): Promise<void> {
  const profile = container.resolve(Profile);
  const veai = container.resolve(Veai);
  const workDir = episode.getWorkDir();

  const outputDir = `${workDir}/${episode.getFileNames().veaiImageDir}`;
  const outputDirExists = await existsDirectory(outputDir);
  let beginFrame: number | undefined;
  if (outputDirExists) {
    beginFrame = await getLastFile(outputDir);
    console.log(`Starting at frame ${beginFrame}`);
  } else {
    await mkdir(outputDir);
  }

  await veai.run({
    inputFile: `${workDir}/${episode.getFileNames().deinterlacedAvi}`,
    outputDir,
    aiModel: profile.config.upscaleModel,
    outputFormat: profile.config.imageFormat,
    beginFrame,
    dimensions: {
      width: 1920,
      height: 1080,
    },
    grainAmount: profile.config.grainAmount,
    grainSize: profile.config.grainSize,
  });
}
