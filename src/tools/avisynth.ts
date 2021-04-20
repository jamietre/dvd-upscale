import { promises } from "fs";
import { Config } from "../lib/config";
import { TempDir } from "../util/node/tempdir";
import { FFMpeg } from "./ffmpeg";
const { writeFile } = promises;

abstract class AviSynth {
  constructor(private config: Config, private script: string) {}
  async write(workDir: string, scriptOptions: { [key: string]: string }) {
    const tmpDir = TempDir.createInDir(workDir);
    await tmpDir.create();
    const avisFile = `${tmpDir.path}/script.avs`;
    const scriptVars = Object.entries(scriptOptions)
      .map((key, value) => {
        return `${key}=\"${value}\"`;
      })
      .join("\n");
    await writeFile(avisFile, `${scriptVars}\n${this.script}`, "utf-8");

    const ffmpeg = new FFMpeg(this.config);
    ffmpeg.inputs.push;
  }
}
