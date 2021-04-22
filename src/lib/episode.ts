// given a file prefix like "Stargate SG1" and an episode like "S1E01", find the matching file
// todo: stand up a typescript project
// use minimatch
import { promises } from "fs";
import { getDgIndexDataForEpisode } from "../tools/dgindex";
import { existsDirectory } from "../util/node/fs-helpers";
import { EpisodeData, Profile, ProfileConfig } from "./profile";
const { mkdir } = promises;

type EpisodeOptions = {
  profile: Profile;
  data: EpisodeData;
};

export class Episode {
  readonly profile: Profile;
  readonly data: EpisodeData;
  private get config(): ProfileConfig {
    return this.profile.config;
  }

  constructor(options: EpisodeOptions) {
    this.profile = options.profile;
    this.data = options.data;
  }

  /**
   * Return the code for an episode, e.g. s1e02
   */
  getEpisodeId() {
    const { season, episodeNum } = this.data;
    return `s${season}e${episodeNum}`;
  }

  getWorkDir(): string {
    const { season } = this.data;
    return `${this.config.projectDir}/S${season}/${this.getEpisodeId()} - ${this.getTitle()}`;
  }

  async ensureWorkDir(): Promise<string> {
    const workDir = this.getWorkDir();
    if (!(await existsDirectory(workDir))) {
      await mkdir(workDir, { recursive: false });
    }
    return workDir;
  }

  /**
   * The base file name for an epise, e.g. "Star Trek Voyager - s1e01 - Caretaker"
   */
  getBaseFileName() {
    const { season, episodeNum } = this.data;
    // todo: add validator for episodeId
    const episodeName = this.getTitle();
    return `${this.config.episodeRootName} - s${season}e${episodeNum} - ${episodeName}`;
  }

  /**
   * Get the title of the episode
   */
  getTitle(): string {
    return this.data.title;
  }

  getFileNames() {
    const baseFileName = this.getBaseFileName();
    return {
      vob: baseFileName + ".VOB",
      ifo: baseFileName + ".IFO",
      chapters: baseFileName + ".chapters.txt",
      timecodeMetrics: baseFileName + ".timecodes.txt",
      deinterlacedAvi: `${baseFileName}.${this.profile.getDeintModel().name}.mkv`,
    };
  }
  async getDgIndexFiles() {
    return getDgIndexDataForEpisode(this);
  }
}

export function parseEpisodeId(
  pattern: string
): {
  season: number;
  episodeNum: string;
} {
  const matches = pattern.match(/[sS]([1-9])[eE]([0-9]+)/);
  if (!matches || !matches.length) {
    throw new Error(`"${pattern}" could not be parsed; it should be in the format s1e03`);
  }
  const season = Number(matches[1]);
  const episodeNum = matches[2];
  return {
    season,
    episodeNum,
  };
}

/**
 * Locate the file for the current episode. "episodePattern" should be something like "s1e03"
 * Returns the extensionless episode file name
 */
// export async function getEpisode(profile: Profile, episodePattern: string): Promise<Episode> {
//   const minimatchOpts = { nocase: true };
//   const dir = profile.config.projectDir;

//   const episode = parseEpisodePattern(episodePattern);

//   const files = (await readdir(dir)) || [];
//   const matches = files.filter(file => minimatch(file, episodePattern, minimatchOpts));
//   if (matches.length === 0) {
//     throw new Error(`No files in "${dir}" matched "${episodePattern}"!`);
//     process.exit(1);
//   }
//   if (matches.length > 1) {
//     console.log(`Multiple files in "${dir}" matched "${episodePattern}"!`);
//     process.exit(1);
//   }

//   const filename = matches[0];
//   const ext = path.extname(filename);
//   const episodeBaseName = path.basename(filename, ext);
//   const episode = new Episode({
//     profile,

//   });
//   return episode;
// }
