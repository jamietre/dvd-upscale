import { promises } from "fs";
import { injectable } from "tsyringe";
import { deleteFilesForPattern } from "../util/node/delete-files";

import { TempDir } from "../util/node/tempdir";
import { Aspect, FFMpeg } from "./ffmpeg";

const { writeFile } = promises;

export type AvisScriptOptions = {
  passNumber: number;
  inputFile: string;
  ouptutFileBase: string;
  timecodeFileName: string;
};

@injectable()
export class AviSynth {
  constructor(private ffmpeg: FFMpeg) {}
  async run(runOptions: {
    script: string;
    workDir: string;
    outputFile: string;
    aspect: Aspect;
    scriptOptions: AvisScriptOptions;
  }) {
    const { ffmpeg } = this;
    const { script, workDir, outputFile, scriptOptions, aspect } = runOptions;
    await deleteFilesForPattern(workDir, "avisynth-tmp*");
    const tmpDir = TempDir.createInDir(workDir, "avisynth-tmp");

    // this.validateScriptOptions(scriptOptions);

    await tmpDir.create();
    try {
      const avisFile = `${tmpDir.path}/script.avs`;
      const scriptVars = Object.entries(scriptOptions)
        .map(([key, value]) => {
          return `${key}=${JSON.stringify(value)}`;
        })
        .join("\n");

      await writeFile(avisFile, `${scriptVars}\n${script}`, "utf-8");
      const input = ffmpeg.createInput(avisFile);
      input.inputFormat = "avi";

      ffmpeg.createOutput({
        stream: {
          type: "v",
          codec: {
            name: "huffyuv",
          },
          aspect,
        },
      });
      ffmpeg.createOutput({
        stream: {
          type: "a",
          codec: {
            name: "copy",
          },
        },
      });
      ffmpeg.setGlobalOptions({
        outputFile,
      });
      await ffmpeg.run();
    } finally {
      // await tmpDir.delete();
    }
  }
  // validateScriptOptions(options: ScriptOptions) {
  //   const { api } = this;
  //   const errors: string[] = [];
  //   Object.entries(api.options).forEach(([option, description]) => {
  //     if (!options.hasOwnProperty(option)) {
  //       errors.push(`The option "${option}": "${description}" was not provided`);
  //     }
  //   });
  //   Object.keys(options).forEach(key => {
  //     if (!api.hasOwnProperty(key)) {
  //       errors.push(`The option "${key}" is not part of the API for this script.`);
  //     }
  //   });
  //   if (errors.length) {
  //     throw new Error(
  //       "The options provided weren't correct for this script.\n" + errors.join(";\n")
  //     );
  //   }
  // }
}

// function getApi(script: string): ScriptOptions {
//   const api: ScriptOptions = {};
//   const lines = splitLines(script);
//   let foundApi = false;
//   for (let lineNum = 0; lineNum < lines.length; lineNum++) {
//     const line = lines[lineNum];
//     if (!foundApi) {
//       if (line.startsWith("# API")) {
//         foundApi = true;
//       }
//       continue;
//     }
//     if (!line.startsWith("#")) {
//       break;
//     }
//     const prop = JSON.parse(`{${line}}`);
//     Object.assign(api, prop);
//   }
//   return api;
// }
