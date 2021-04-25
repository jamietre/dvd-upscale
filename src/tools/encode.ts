import { promises } from "fs";
import { container } from "tsyringe";
import { Episode } from "../lib/episode";
import { getAbsolutePath } from "../util/node/files";
import { AviSynth, AvisScriptOptions } from "./avisynth";
import { FFMpeg } from "./ffmpeg";

const { readFile } = promises;

export async function encode(episode: Episode) {
  const { profile } = episode;

  const workDir = episode.getWorkDir();
  const ff = container.resolve(FFMpeg);
  const input1 = ff.createInput("input-file-1");
  const input2 = ff.createInput("input-file-2");

  ff.createOutput({
    stream: {
      type: "v",
      codec: {
        name: "libx265",
        crf: 20,
        profile: "main10",
        preset: "slow",
      },
    },
    map: {
      input: input1,
      streamIndex: 0,
    },
  });

  ff.createOutput({
    stream: {
      type: "a",
      codec: {
        name: "copy",
      },
    },
    map: {
      input: input2,
      streamIndex: "all",
    },
  });
}
