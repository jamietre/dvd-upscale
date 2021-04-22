import { promises } from "fs";
import { Context } from "../lib/context";
import { Episode } from "../lib/episode";
import { getAbsolutePath } from "../util/node/files";
import { AviSynth, AvisScriptOptions } from "./avisynth";
import { FFMpeg } from "./ffmpeg";

const { readFile } = promises;

export async function deinterlace(context: Context, episode: Episode) {
  const { profile } = episode;
  const workDir = episode.getWorkDir();
  const model = profile.getDeintModel();
  for (const script of model.scripts) {
    const passes = script.passes ?? 1;
    for (let pass = 0; pass < passes; pass++) {
      const fileName = getAbsolutePath(script.scriptPath);
      const scriptText = await readFile(fileName, "utf-8");
      const avis = new AviSynth({
        config: context.config,
        ffmpegProvider: () => new FFMpeg(context.config),
        script: scriptText,
      });

      const dgIndexFiles = await episode.getDgIndexFiles();
      const baseFileName = episode.getBaseFileName();
      const scriptOptions: AvisScriptOptions = {
        passNumber: pass,
        inputFile: `${workDir}/${dgIndexFiles.d2vIndex}`,
        ouptutFileBase: `${workDir}/${baseFileName}.tmp`,
        timecodeFileName: `${workDir}/${baseFileName}.timecode`,
      };
      await avis.run({
        workDir,
        aspect: profile.config.aspectRatio,
        outputFile: `${workDir}/${episode.getFileNames().deinterlacedAvi}`,
        scriptOptions,
      });
    }
  }
}
