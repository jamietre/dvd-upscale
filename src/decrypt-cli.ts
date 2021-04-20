import { ArgumentParser } from "argparse";
// import prompt from "prompt";

import { loadConfig } from "./lib/config";
import { Context, CliContext } from "./lib/context";
import { loadProfile } from "./lib/profile";
import { decryptDvd } from "./tools/decrypt";

export type CliCallback = (context: Context, options: CliOptions) => Promise<void>;

type CliOptions = {
  project: string;
  driveLetter: string;
  season: string;
  disc: string;
};

async function main(callback: CliCallback): Promise<void> {
  const parser = new ArgumentParser({
    description: "dgindex",
  });
  parser.add_argument("-project", "-p", {
    dest: "project",
    help: "Name of project to load",
    required: true,
  });
  parser.add_argument("-drive", "-dl", {
    dest: "driveLetter",
    help: "Drive letter to read",
    required: true,
  });
  parser.add_argument("-season", "-s", {
    dest: "season",
    help: "Season number",
    required: true,
  });
  parser.add_argument("-disc", "-dvd", {
    dest: "disc",
    help: "Number of DVD in series",
    required: false,
  });

  const [args, _extra] = parser.parse_known_args(process.argv) as [CliOptions, unknown];

  const config = await loadConfig();
  const profile = await loadProfile(args.project);
  const context = new CliContext({
    config,
    profile,
  });
  await callback(context, args);
}

async function decryptDvdCallback(context: Context, options: CliOptions): Promise<void> {
  const { logger, profile } = context;
  const season = Number(options.season);
  // if (!options.disc) {
  //   return decryptSeason(context, options);
  // }

  logger.info(`Decrypting drive ${options.driveLetter} to "${profile.config.projectDir}"`);

  await decryptDvd({
    context,
    disc: Number(options.disc),
    driveLetter: options.driveLetter,
    season: Number(season),
  });
}

// async function decryptSeason(context: Context, options: CliOptions): Promise<void> {
//   const seasons = context.profile.episodes.sort((a, b) => {
//     if (a.disc !== b.disc) {
//       return a.disc < b.disc ? -1 : 1;
//     }
//     return a.episodeOrder < b.episodeOrder ? -1 : b.episodeOrder < a.episodeOrder ? 1 : 0;
//   });

//   prompt.message = "";
//   prompt.start();
//   await prompt.get([]);
// }

main(decryptDvdCallback).catch(e => {
  console.error(e);
  process.exit(1);
});
