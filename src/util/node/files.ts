import path from "path";
import appRootPath from "app-root-path";

/**
 * Return the absolute path for path relative to
 * 1) <rootDir> or <configDir>, if specified,
 * 2) the cww
 */
export function getAbsolutePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  if (filePath.startsWith("<")) {
    let fullPath = filePath.replace("<rootDir>", appRootPath.resolve(""));
    fullPath = fullPath.replace("<configDir>", appRootPath.resolve("config"));
    return fullPath;
  }
  return path.join(process.cwd(), filePath);
}
