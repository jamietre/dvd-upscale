import { promises } from "fs";
import { container } from "tsyringe";
import { Episode } from "../lib/episode";
import { getAbsolutePath } from "../util/node/files";
import { AviSynth, AvisScriptOptions } from "./avisynth";

const { readFile } = promises;

export async function deinterlace(episode: Episode) {
  const { profile } = episode;

  const workDir = episode.getWorkDir();
  const model = profile.getDeintModel();
  for (const script of model.scripts) {
    const passes = script.passes ?? 1;
    for (let pass = 1; pass <= passes; pass++) {
      const fileName = getAbsolutePath(script.scriptPath);
      const scriptText = await readFile(fileName, "utf-8");
      const avis = container.resolve(AviSynth);
      const dgIndexFiles = await episode.getDgIndexFiles();
      const baseFileName = episode.getBaseFileName();
      const scriptOptions: AvisScriptOptions = {
        passNumber: pass,
        inputFile: `${workDir}/${dgIndexFiles.d2vIndex}`,
        ouptutFileBase: `${workDir}/${baseFileName}.tmp`,
        timecodeFileName: `${workDir}/${baseFileName}.timecodes.txt`,
      };
      await avis.run({
        script: scriptText,
        workDir,
        aspect: profile.config.aspectRatio,
        outputFile: `${workDir}/${episode.getFileNames().deinterlacedAvi}`,
        scriptOptions,
      });
    }
  }
}
