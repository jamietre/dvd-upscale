import { container } from "tsyringe";
import { Episode } from "../lib/episode";
import { FFMpeg } from "./ffmpeg";

export async function encode(episode: Episode) {
  const ff = container.resolve(FFMpeg);
  const workDir = episode.getWorkDir();
  const imageDir = episode.getFileNames().veaiImageDir;
  const imageFileExt = episode.profile.imageFileExtension;
  const vobSource = episode.getFileNames().vob;

  const input1 = ff.createInput(`${workDir}/${imageDir}/%06d.${imageFileExt}`, {
    threadQueueSize: 512,
    framerate: episode.profile.framerate,
  });
  const input2 = ff.createInput(`${workDir}/${vobSource}`, { threadQueueSize: 512 });

  ff.createOutput({
    stream: {
      type: "v",
      codec: {
        name: "libx265",
        crf: 20,
        profile: "main10",
        preset: "slower",
      },
      filters: {
        format: "yuv420p10le",
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

  ff.createOutput({
    stream: {
      type: "s",
      codec: {
        name: "copy",
      },
    },
    map: {
      input: input2,
      streamIndex: "all",
    },
    disposition: {
      input: input1,
      streamIndex: 0,
      disposition: "0",
    },
  });

  ff.setGlobalOptions({
    outputFile: `${workDir}/${episode.getFileNames().rawEncodedFile}`,
    maxInterleaveDelta: 0,
    defaultMode: "infer_no_subs",
    logLevel: "info",
  });

  await ff.run({ showCommand: true });
}
