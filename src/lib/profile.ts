import appRootPath from "app-root-path";
import { promises } from "fs";
import path from "path";

import { assertIncludes } from "../util/assert";
import { loadConfigFile } from "../util/node/config-file";
import { Episode } from "./episode";

const { readFile } = promises;

export const deintModels = ["itvt1", "ivtc2", "ivtc3", "ivtc4"] as const;
export type DeintModel = typeof deintModels[number];

export const upscaleModels = ["ghq-5", "amq-12"] as const;
export type UpscaleModel = typeof upscaleModels[number];

export const targetFramerates = ["30000/10001", "24000/1001"] as const;
export type TargetFramerate = typeof targetFramerates[number];

export const aspectRatios = ["4:3", "16:9"] as const;
export type AspectRatios = typeof aspectRatios[number];

export const imageFormats = ["png", "tiff8", "tiff16"] as const;
export type ImageFormats = typeof imageFormats[number];

export type EpisodeData = {
  season: number;
  episodeNum: string;
  episodeOrder: number;
  title: string;
  disc: number;
  vts: number;
  pgc: number;
};

export type ProfileConfig = {
  deintModel: DeintModel;
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

export interface Profile {
  config: ProfileConfig;
  episodes: EpisodeData[];
  getEpisode({ season, episodeNum }: Pick<EpisodeData, "season" | "episodeNum">): Episode;
}

export class ProfileImpl implements Profile {
  get config(): ProfileConfig {
    return this.options.config;
  }
  get episodes(): EpisodeData[] {
    return this.options.episodes;
  }
  constructor(private options: { config: ProfileConfig; episodes: EpisodeData[] }) {}
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
  /**
   * Get the full name of the show, e.g. "Star Trek Voyager"
   */
  showName() {
    return this.config.episodeRootName;
  }
}

function assertIsProfileConfig(obj: object | ProfileConfig): asserts obj is ProfileConfig {
  const profile = obj as ProfileConfig;
  assertIncludes(deintModels, profile.deintModel, "deinterlace model");
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
  const episodes = JSON.parse(episodesJson);

  assertIsProfileConfig(config);

  const profile = new ProfileImpl({ config, episodes });
  return profile;
}
