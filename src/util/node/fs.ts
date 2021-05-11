import { mkdir, readdir } from "fs/promises";
import { mkdirp } from "./fs-helpers";

export class Fs {
  mkdir = mkdir;
  mkdirp = mkdirp;
  readdir = readdir;
}
