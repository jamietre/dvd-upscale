import { ArgumentParser } from "argparse";
import { container } from "./util/di";
import { registerEnvironment } from "./lib/cli";
// import prompt from "prompt";

import { Context } from "./lib/context";
import { decryptDvd } from "./tools/decrypt";
import { Profile } from "./lib/profile";
import { Logger } from "./lib/logger/logger";
import { assertIsDefined } from "./util/types";
import { DiscIdentifier } from "./util/node/disc-id";
import { parseDrive } from "./util/node/fs-helpers";

export type CliCallback = (options: CliOptions) => Promise<void>;

type CliOptions = {
  project: string;
  driveLetter: string;
  season?: number;
  disc?: number;
  update?: boolean;
  dryRun?: boolean;
};

type DiscId = {
  season: number;
  disc: number;
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
    type: "int",
    required: false,
  });
  parser.add_argument("-disc", "-dvd", {
    dest: "disc",
    help: "Number of DVD in series",
    type: "int",
    required: false,
  });
  parser.add_argument("-update", "-u", {
    dest: "update",
    action: "store_true",
    help: "Update disc signature info",
    required: false,
  });
  parser.add_argument("-dry-run", "-dr", {
    dest: "dryRun",
    action: "store_true",
    help: "Do not rip discs, but will update hash if requested",
    required: false,
  });

  const args = parser.parse_args(process.argv.slice(2)) as CliOptions;

  await registerEnvironment(args.project);
  await callback(args);
}

async function decryptDvdCallback(options: CliOptions): Promise<void> {
  const context = container.resolve(Context);
  const { logger, profile } = context;
  const { disc, season } = await getDiscAndSeason(profile, options);
  const driveLetter = parseDrive(options.driveLetter);

  logger.info(`Decrypting drive ${driveLetter} to "${profile.config.projectDir}"`);

  if (options.dryRun) {
    logger.info("-dry-run specified; exiting.");
    return;
  }

  await decryptDvd({
    context,
    disc,
    season,
    driveLetter,
  });
}

function isDiscId(options: Pick<CliOptions, "season" | "disc">): options is DiscId {
  return options.season !== undefined && options.disc !== undefined;
}

async function getDiscAndSeason(
  profile: Profile,
  options: CliOptions
): Promise<{ disc: number; season: number }> {
  const logger = container.resolve(Logger);
  logger.info("Reading disc info...");
  const discId = new DiscIdentifier();
  const hash = await discId.getDdvdHash(options.driveLetter);
  assertIsDefined(hash, "No hash could be obtained");
  const discInfo = await profile.getDiscForHash(hash);

  if (discInfo) {
    if (
      isDiscId(options) &&
      (options.disc !== discInfo.disc || options.season !== discInfo.season)
    ) {
      throw new Error(
        `The has "${hash} matches S${discInfo.season} D${discInfo.disc}, but you specificed S${options.season} D${options.disc}`
      );
    }
    logger.info(`Identified Season ${discInfo.season}, Disc ${discInfo.disc}`);
    return {
      season: discInfo.season,
      disc: discInfo.disc,
    };
  }
  if (options.update) {
    if (!isDiscId(options)) {
      throw new Error(`You asked to update the hash, but season & disc were not provided.`);
    }
    profile.addDiscHash(options.season, options.disc, hash);

    await profile.saveDiscProfile();
  }

  if (!isDiscId(options)) {
    throw new Error(
      `There was no hash match for this disc, and you didn't provide season & disc number.`
    );
  }

  return {
    disc: options.disc,
    season: options.season,
  };
}

main(decryptDvdCallback).catch(e => {
  console.error(e);
  process.exit(1);
});
