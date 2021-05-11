import { injectable, container } from "tsyringe";

import { Config } from "../lib/config";
import { CommandRunner } from "../util/node/command-runner";
import { Episode } from "../lib/episode";

type MkvMergeOptions = {
  inputFile: string;
  outputFile: string;
  timestampsFile?: string;
  chaptersFile?: string;
};

export type CommandOptions = {
  showCommand?: true;
};

@injectable()
export class MkvMerge {
  constructor(private config: Config, private commandRunner: CommandRunner) {}
  private getArgs(options: MkvMergeOptions): string[] {
    const args: string[] = [];
    args.push("-o", options.outputFile);
    if (options.timestampsFile) {
      args.push("--timestamps", `0:${options.timestampsFile}`);
    }
    if (options.chaptersFile) {
      args.push("--chapters", options.chaptersFile);
    }

    args.push(options.inputFile);
    return args;
  }
  async run(options: MkvMergeOptions, commandOptions: CommandOptions = {}): Promise<void> {
    const { config, commandRunner } = this;
    const args = this.getArgs(options);
    await commandRunner.run(config.mkvmerge, args, {
      showCommand: commandOptions.showCommand,
    });
  }
}

export async function mergeChaptersTimecodes(episode: Episode): Promise<void> {
  const mkvMerge = container.resolve(MkvMerge);
  const workDir = episode.getWorkDir();
  const files = episode.getFileNames();

  await mkvMerge.run(
    {
      inputFile: `${workDir}/${files.rawEncodedFile}`,
      outputFile: `${workDir}/${files.finalEncodedFile}`,
      chaptersFile: `${workDir}/${files.chapters}`,
      timestampsFile: `${workDir}/${files.timecodeMetrics}`,
    },
    {
      showCommand: true,
    }
  );
}
