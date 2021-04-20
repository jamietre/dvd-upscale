import { ArgumentParser } from "argparse";
import { loadConfig } from "./config";
import { Context } from "./context";
import { Episode, parseEpisodeId } from "./episode";
import { loadProfile } from "./profile";

export type CliCallback = (context: Context, episode: Episode) => Promise<void>;

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

  const config = await loadConfig();
  const profile = await loadProfile(args.project);
  const episodeId = parseEpisodeId(args.episodeId);
  const episode = profile.getEpisode(episodeId);
  const context = new Context({
    config,
    profile,
  });
  await callback(context, episode);
}

export function startCli(callback: CliCallback) {
  commonCli(callback).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
