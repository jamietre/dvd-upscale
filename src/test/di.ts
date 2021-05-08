import "reflect-metadata";

import { container, DependencyContainer } from "tsyringe";
import { Config } from "../lib/config";
import { Context } from "../lib/context";
import { Episode } from "../lib/episode";
import { Logger } from "../lib/logger/logger";
import { EpisodeData, Profile, ProfileConfig } from "../lib/profile";
import { CommandRunner } from "../util/node/command-runner";
import { MockCommandRunner } from "./mock-command-runner";

configureDiContainer(container);

export { container };

function configureDiContainer(container: DependencyContainer) {
  container.register(Config, { useValue: getTestConfig() });
  container.register(Context, { useValue: getTestContext() });
  container.register(CommandRunner, {
    useFactory: () => {
      return (new MockCommandRunner() as unknown) as CommandRunner;
    },
  });
}

export function getTestConfig() {
  const testConfig = new Config({
    ffmpeg: "/path/to/ffmpeg",
    veai: "/path/to/veai",
    dgindex: "/path/to/degindex",
    mkvmerge: "/path/to/mkvmerge",
    dvdDecrypter: "/path/to/dvddecrypter",
  });
  return testConfig;
}

export function getTestProfileConfig(): ProfileConfig {
  const profileConfig: ProfileConfig = {
    upscaleModel: "ghq-5",
    deintModel: "ivtc5",
    grainSize: 1,
    grainAmount: 1.5,
    targetFramerate: "24000/1001",
    aspectRatio: "16:9",
    imageFormat: "png",
    projectDir: "/path/to/project",
    episodeRootName: "My Show",
    targetCodec: "h265",
  };
  return profileConfig;
}
export function getTestProfile() {
  const testProfile: Profile = new Profile({
    config: getTestProfileConfig(),
    discProfilePath: "",
  });
  return testProfile;
}

export function getTestEpisodeData(): EpisodeData {
  const data: EpisodeData = {
    disc: 1,
    episodeNum: "01",
    episodeOrder: 1,
    pgc: 2,
    vts: 3,
    season: 1,
    title: "Star Trek Voyager",
  };
  return data;
}

export function getTestEpisode() {
  const testEpisode = new Episode({
    profile: getTestProfile(),
    data: getTestEpisodeData(),
  });
  return testEpisode;
}

export function getTestContext() {
  const testContext: Context = {
    config: getTestConfig(),
    profile: getTestProfile(),
    logger: new Logger(console),
  };
  return testContext;
}
