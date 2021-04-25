import appRootPath from "app-root-path";
import { promises } from "fs";
import path from "path";

import { assertIncludes } from "../util/assert";
import { loadConfigFile } from "../util/node/config-file";
import { assertIsDefined, UnknownObject } from "../util/types";
import { Episode } from "./episode";

const { readFile, writeFile } = promises;

export const deintModelPresetNames = ["none", "ivtc5"] as const;
export type DeintModelPreset = typeof deintModelPresetNames[number];

export const upscaleModels = ["ghq-5", "amq-12", "amq-13"] as const;
export type UpscaleModel = typeof upscaleModels[number];

export const targetFramerates = ["30000/10001", "24000/1001"] as const;
export type TargetFramerate = typeof targetFramerates[number];

export const aspectRatios = ["4:3", "16:9"] as const;
export type AspectRatios = typeof aspectRatios[number];

export const imageFormats = ["png", "tiff8", "tiff16"] as const;
export type ImageFormats = typeof imageFormats[number];

export type ProjectDiscProfile = {
  episodes: EpisodeData[];
  discs: DiscData[];
};

export type DiscData = {
  season: number;
  disc: number;
  hashes: string[];
};

export type EpisodeData = {
  season: number;
  episodeNum: string;
  episodeOrder: number;
  title: string;
  disc: number;
  vts: number;
  pgc: number;
  hashes?: string[];
};

export type AvisynthScript = {
  scriptPath: string;
  passes?: number;
};
export type DeintModelSpec = {
  name: string;
  scripts: AvisynthScript[];
};

const deintModelPresets = {
  ivtc5: {
    name: "ivtc5",
    scripts: [
      {
        scriptPath: "<configDir>/avisynth/ivtc5.avs",
        passes: 2,
      },
    ],
  },
};

export type ProfileConfig = {
  deintModel: DeintModelPreset;
  deintModelSpec?: DeintModelSpec;
  upscaleModel: UpscaleModel;
  grainSize: number;
  grainAmount: number;
  projectDir: string;
  targetFramerate: TargetFramerate;
  aspectRatio: AspectRatios;
  imageFormat: ImageFormats;
  /**
   * The part of the episode filename shared by all episodes; e.g. if
   * episodes are named "Star Trek Voyager - s1e01 - Caretaker.VOB" then
   * this should be "Star Trek Voyager". This is used for pattern matching.
   * Probably we should make this more robust; allow end user just to provide
   * a glob?
   */
  episodeRootName: string;
};

export class Profile {
  get config(): ProfileConfig {
    return this.options.config;
  }
  get episodes(): EpisodeData[] {
    return this.options.discProfile.episodes;
  }
  get discs(): DiscData[] {
    return this.options.discProfile.discs;
  }
  constructor(
    private options: {
      config: ProfileConfig;
      discProfile: ProjectDiscProfile;
      discProfilePath: string;
    }
  ) {}
  getEpisode({ season, episodeNum }: Pick<EpisodeData, "season" | "episodeNum">): Episode {
    const episodeArr = this.episodes.filter(
      e => e.season === season && e.episodeNum === episodeNum
    );
    if (this.episodes.length === 0) {
      throw new Error(`Couldn't find season ${season}, episode ${episodeNum}`);
    }
    const data = episodeArr[0];
    return new Episode({
      profile: this,
      data,
    });
  }
  getEpisodesForDisc(season: number, disc: number) {
    const episodeArr = this.episodes.filter(e => e.season === season && e.disc === disc);
    if (this.episodes.length === 0) {
      throw new Error(`Couldn't find season ${season}, disc ${disc}`);
    }
    return episodeArr;
  }
  getDiscProfile(season: number, disc: number): DiscData {
    const discData = this.discs.filter(e => e.season === season && e.disc === disc);
    if (discData.length !== 1) {
      throw new Error(`Couldn't find season ${season}, disc ${disc}`);
    }
    return discData[0];
  }
  getDiscForHash(hash: string): { season: number; disc: number } | undefined {
    const matches = this.discs.filter(e => e.hashes.includes(hash));
    if (matches.length > 1) {
      throw new Error(`There were multiple matches for the hash ${hash}, aborting.`);
    }
    if (matches.length === 0) {
      return undefined;
    }
    const match = matches[0];
    return { disc: match.disc, season: match.season };
  }
  getDeintModel(): DeintModelSpec {
    const { config } = this;
    const preset = config.deintModel;
    if (preset === "none") {
      assertIsDefined(config.deintModelSpec);
      return config.deintModelSpec;
    }
    return deintModelPresets[preset];
  }
  async saveDiscProfile(): Promise<void> {
    const { discProfilePath } = this.options;
    const data: ProjectDiscProfile = {
      discs: this.discs,
      episodes: this.episodes,
    };
    await writeFile(discProfilePath, JSON.stringify(data, null, 2), "utf-8");
  }
  /**
   * Get the full name of the show, e.g. "Star Trek Voyager"
   */
  showName() {
    return this.config.episodeRootName;
  }
}

function assertIsProfileConfig(obj: UnknownObject | ProfileConfig): asserts obj is ProfileConfig {
  const profile = obj as ProfileConfig;
  assertIncludes(deintModelPresetNames, profile.deintModel, "deinterlace model");
  assertIncludes(upscaleModels, profile.upscaleModel, "upscale model");
  assertIncludes(targetFramerates, profile.targetFramerate, "framerate");
  assertIncludes(aspectRatios, profile.aspectRatio, "aspect ratio");
  assertIncludes(imageFormats, profile.imageFormat, "image format");
}

export async function loadProfile(profileName: string): Promise<Profile> {
  const config = (await loadConfigFile(profileName)) as any;

  let sourcePath = (config as any).seasonsSource;
  if (!path.isAbsolute(sourcePath)) {
    sourcePath = appRootPath.resolve(`config/${sourcePath}`);
  }
  const episodesJson = await readFile(sourcePath, "utf-8");
  const discProfile = JSON.parse(episodesJson) as ProjectDiscProfile;

  assertIsProfileConfig(config);

  const profile = new Profile({ config, discProfile, discProfilePath: sourcePath });
  return profile;
}
