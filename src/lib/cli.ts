import { container } from "../util/di";
import { ArgumentParser } from "argparse";
import { loadConfig, Config } from "./config";
import { Context } from "./context";
import { Episode, parseEpisodeId } from "./episode";
import { loadProfile, Profile } from "./profile";
import { CommandRunner } from "../util/node/command-runner";
import { FFMpeg } from "../tools/ffmpeg";
import { Logger } from "./logger/logger";
import { AviSynth } from "../tools/avisynth";
import { Veai } from "../tools/veai";
import { Fs } from "../util/node/fs";
import { MkvMerge } from "../tools/mkvmerge";

export type CliCallback = (episode: Episode) => Promise<void>;

type CliOptions = {
  project: string;
  episodeId: string;
};

async function commonCli(callback: CliCallback) {
  const parser = new ArgumentParser({
    description: "dgindex",
  });

  parser.add_argument("project", {
    help: "Name of project to load",
  });
  parser.add_argument("episodeId", {
    help: 'Name of episode to load, e.g. "s1e02"',
  });

  const nodeArgIndex = process.argv.findIndex(e => e.endsWith(".exe") || e.endsWith(".js"));
  const processArgv = process.argv.slice(nodeArgIndex + 2);
  const [args, _extra] = parser.parse_known_args(processArgv) as [CliOptions, unknown];

  await registerEnvironment(args.project);

  const episodeId = parseEpisodeId(args.episodeId);
  const profile = container.resolve(Profile);
  const context = container.resolve(Context);
  const episode = profile.getEpisode(episodeId);

  context.logger.info(`Work dir: ${episode.getWorkDir()}`);

  await callback(episode);
}

export async function registerEnvironment(profileName: string) {
  const profile = await loadProfile(profileName);
  const config = await loadConfig();
  const context = new Context({
    config,
    profile,
  });
  container.register(Fs, { useValue: new Fs() });
  container.register(Logger, { useValue: new Logger(console) });
  container.register(Config, { useValue: config });
  container.register(Context, { useValue: context });
  container.register(CommandRunner, { useClass: CommandRunner });
  container.register(Profile, { useValue: profile });
  container.register(FFMpeg, { useClass: FFMpeg });
  container.register(AviSynth, { useClass: AviSynth });
  container.register(Veai, { useClass: Veai });
  container.register(MkvMerge, { useClass: MkvMerge });
}

export function startCli(callback: CliCallback) {
  commonCli(callback).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
