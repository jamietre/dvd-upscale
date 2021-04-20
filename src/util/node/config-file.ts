import path from "path";
import { promises } from "fs";
import appRootPath from "app-root-path";
const { readFile } = promises;

/**
 * Load files 1) via "config" directory
 * 2) via absolute path
 */
export async function loadConfigFile(configFileName: string): Promise<object> {
  let filePath: string;
  if (!path.isAbsolute(configFileName)) {
    filePath = appRootPath.resolve(`config/${configFileName}.json`);
  } else {
    filePath = configFileName;
  }

  const profileJson = await readFile(filePath, "utf-8");
  const obj = JSON.parse(profileJson);
  return obj;
}
