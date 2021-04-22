import { assertFileExists } from "../util/assert";
import { loadConfigFile } from "../util/node/config-file";
import { UnknownObject } from "../util/types";

export interface Config {
  ffmpeg: string;
  veai: string;
  dgindex: string;
  mkvmerge: string;
  dvdDecrypter: string;
}

export async function getValidConfig(obj: UnknownObject | Config): Promise<Config> {
  const config = obj as Config;
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
