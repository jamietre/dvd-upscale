import appRootPath from "app-root-path";
import { promises } from "fs";
import path from "path";

import { assertHasOneElement, assertIncludes } from "../util/assert";
import { loadConfigFile } from "../util/node/config-file";
import { assertIsDefined, assertNever, UnknownObject } from "../util/types";
import { Episode } from "./episode";
import { AiModel, aiModels, ImageFormats, imageFormats } from "../tools/veai";
import { Framerate, framerates } from "../tools/ffmpeg";

const { readFile, writeFile } = promises;

export const deintModelPresetNames = ["none", "ivtc3", "ivtc5", "ivtc6"] as const;
export type DeintModelPreset = typeof deintModelPresetNames[number];

export const aspectRatios = ["4:3", "16:9"] as const;
export type AspectRatios = typeof aspectRatios[number];

export type ProjectDiscProfile = {
  episodes: EpisodeData[];
  discs: DiscData[];
};

export type DiscMetadata = [
  /**
   * File on the DVD that is used for a hash. For some sets (like DS9) VTS_01_0.VOB is not unique.
   * For others, this is one of the episodes, and would take a long time to hash. Try to find
   * something that's small & un
   */
  hashFile: string
];
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

export type TargetCodec = "h265";

// TODO: Move this to JSON config!
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
  ivtc3: {
    name: "ivtc3",
    scripts: [
      {
        scriptPath: "<configDir>/avisynth/ivtc3.avs",
        passes: 2,
      },
    ],
  },
  ivtc6: {
    name: "ivtc6",
    scripts: [
      {
        scriptPath: "<configDir>/avisynth/ivtc6.avs",
        passes: 1,
      },
    ],
  },
};

export type ProfileConfig = {
  deintModel: DeintModelPreset;
  deintModelSpec?: DeintModelSpec;
  upscaleModel: AiModel;
  grainSize: number;
  grainAmount: number;
  projectDir: string;
  targetFramerate: Framerate;
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
  targetCodec: TargetCodec;
};

export class Profile {
  private discProfile: ProjectDiscProfile;
  get config(): ProfileConfig {
    return this.options.config;
  }
  get episodes(): EpisodeData[] {
    return this.discProfile.episodes;
  }
  get discs(): DiscData[] {
    return this.discProfile.discs;
  }
  constructor(
    private options: {
      config: ProfileConfig;
      discProfilePath: string;
    }
  ) {
    this.discProfile = {
      discs: [],
      episodes: [],
    };
  }
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
    if (discData.length === 0) {
      const discData = {
        season,
        disc,
        hashes: [],
      };
      this.discs.push(discData);
      return discData;
    }
    assertHasOneElement(
      discData,
      `There were multiple matches for ${season}, disc ${disc}; check your config data.`
    );

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
  addDiscHash(season: number, disc: number, hash: string) {
    const existing = this.getDiscForHash(hash);
    if (existing) {
      return;
    }
    const discProfile = this.getDiscProfile(season, disc);
    const hashes = new Set(discProfile.hashes);
    hashes.add(hash);
    discProfile.hashes = Array.from(hashes);
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
  get imageFileExtension(): string {
    switch (this.config.imageFormat) {
      case "png":
        return "png";
      case "16tif":
      case "8tif":
        return "tif";
      case "jpg":
        return "jpg";
      default:
        assertNever(this.config.imageFormat);
    }
  }
  get framerate(): Framerate {
    return this.config.targetFramerate;
  }
  async loadDiscProfile(): Promise<void> {
    const { discProfilePath } = this.options;
    const episodesJson = await readFile(discProfilePath, "utf-8");
    // TODO: need to merge changes
    const discProfile = JSON.parse(episodesJson) as ProjectDiscProfile;
    const allHashes = discProfile.discs.map(e => e.hashes).flat();
    const allUniqueHashes = new Set(allHashes);
    if (allHashes.length !== allUniqueHashes.size) {
      const dups: string[] = [];
      allHashes.forEach(hash => {
        if (allUniqueHashes.has(hash)) {
          allUniqueHashes.delete(hash);
          return;
        }
        dups.push(hash);
      });
      throw new Error(`The disc hashes are not unique: ${dups.join(",")}`);
    }
    this.discProfile = discProfile;
  }

  async saveDiscProfile(): Promise<void> {
    const { discProfilePath } = this.options;
    const data: ProjectDiscProfile = {
      discs: this.discs.sort(discDataComparer),
      episodes: this.episodes.sort(episodeDataComparer),
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
  assertIncludes(aiModels, profile.upscaleModel, "upscale model");
  assertIncludes(framerates, profile.targetFramerate, "framerate");
  assertIncludes(aspectRatios, profile.aspectRatio, "aspect ratio");
  assertIncludes(imageFormats, profile.imageFormat, "image format");
}

function discDataComparer(a: DiscData, b: DiscData): number {
  return numberComparer(a.season, b.season) || numberComparer(a.disc, b.disc);
}
function episodeDataComparer(a: EpisodeData, b: EpisodeData): number {
  return numberComparer(a.season, b.season) || numberComparer(a.episodeOrder, b.episodeOrder);
}

function numberComparer(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export async function loadProfile(profileName: string): Promise<Profile> {
  const config = (await loadConfigFile(profileName)) as any;

  let sourcePath: string = (config as any).seasonsSource;
  if (!path.isAbsolute(sourcePath)) {
    sourcePath = appRootPath.resolve(`config/${sourcePath}`);
  }

  assertIsProfileConfig(config);

  const profile = new Profile({ config, discProfilePath: sourcePath });
  await profile.loadDiscProfile();
  return profile;
}
