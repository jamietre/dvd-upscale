import crypto from "crypto";
import { createReadStream } from "fs";
import { ArgumentParser } from "argparse";
import { container } from "./util/di";
import { registerEnvironment } from "./lib/cli";
// import prompt from "prompt";

import { Context } from "./lib/context";
import { decryptDvd } from "./tools/decrypt";
import { Profile } from "./lib/profile";
import { Logger } from "./lib/logger/logger";
import { assertIsDefined } from "./util/types";

export type CliCallback = (options: CliOptions) => Promise<void>;

type CliOptions = {
  project: string;
  driveLetter: string;
  season?: number;
  disc?: number;
  update?: boolean;
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

  const [args, _extra] = parser.parse_known_args(process.argv) as [CliOptions, unknown];

  await registerEnvironment(args.project);
  await callback(args);
}

async function decryptDvdCallback(options: CliOptions): Promise<void> {
  const context = container.resolve(Context);
  const { logger, profile } = context;
  const { disc, season } = await getDiscAndSeason(profile, options);
  const driveLetter = parseDrive(options.driveLetter);

  logger.info(`Decrypting drive ${driveLetter} to "${profile.config.projectDir}"`);

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
  const hash = await getDiscHash(options.driveLetter);
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
      disc: discInfo.disc,
      season: discInfo.season,
    };
  }
  if (options.update) {
    if (!isDiscId(options)) {
      throw new Error(`You asked to update the hash, but season & disc were not provided.`);
    }
    const discInfo = profile.getDiscProfile(options.season, options.disc);
    const hashes = new Set(discInfo.hashes);
    hashes.add(hash);
    discInfo.hashes = Array.from(hashes);
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

async function getDiscHash(drive: string): Promise<string> {
  const videoFile = `${parseDrive(drive)}VIDEO_TS/VIDEO_TS.IFO`;
  const hash = await getFileHash(videoFile);
  return hash;
}

async function getFileHash(filePath: string): Promise<string> {
  return new Promise(resolve => {
    // the file you want to get the hash
    const fd = createReadStream(filePath);
    const hash = crypto.createHash("sha1");
    hash.setEncoding("hex");
    hash.on("finish", () => resolve(hash.read()));
    fd.pipe(hash);
  });
}

function parseDrive(drive: string): string {
  const driveUpper = drive.toUpperCase();
  return `${driveUpper.slice(0, 1)}:/`;
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
