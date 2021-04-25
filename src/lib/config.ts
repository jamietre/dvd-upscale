import { injectable } from "tsyringe";
import { assertFileExists } from "../util/assert";
import { loadConfigFile } from "../util/node/config-file";
import { assignDefined } from "../util/objects";
import { UnknownObject } from "../util/types";

@injectable()
export class Config {
  ffmpeg!: string;
  veai!: string;
  dgindex!: string;
  mkvmerge!: string;
  dvdDecrypter!: string;
  constructor(options: Required<Config>) {
    assignDefined(this as Config, options);
  }
}

export async function getValidConfig(obj: UnknownObject | Config): Promise<Config> {
  const config = new Config(obj as Required<Config>);
  await Promise.all([
    assertFileExists(config.dgindex),
    assertFileExists(config.ffmpeg),
    assertFileExists(config.mkvmerge),
    assertFileExists(config.veai),
    assertFileExists(config.dvdDecrypter),
  ]);
  return config;
}

export async function loadConfig(): Promise<Config> {
  const configObj = await loadConfigFile("config");
  const config = await getValidConfig(configObj);
  return config;
}
