import sinon from "sinon";
import { Episode } from "../lib/episode";
import { Profile } from "../lib/profile";

import { container } from "../test/di";
import { CommandRunner } from "../util/node/command-runner";
import { Fs } from "../util/node/fs";
import { encode } from "./encode";

describe("encode", () => {
  it("Arguments are as expected", async () => {
    const commandRunner = {
      run: sinon.stub(),
    };
    const fs = {
      mkdir: sinon.stub().resolves(),
      mkdirp: sinon.stub().resolves(),
    };
    container.register(CommandRunner, { useValue: (commandRunner as unknown) as CommandRunner });
    container.register(Fs, { useValue: fs });

    const profile: Partial<Profile> = {
      imageFileExtension: "png",
      framerate: "25",
    };

    const episode: Partial<Episode> = {
      profile: profile as Profile,
      getWorkDir: sinon.stub().returns("<workDir>"),
      getFileNames: sinon.stub().returns({
        rawEncodedFile: "<outputFileName>",
        vob: "<vobFileName>",
        veaiImageDir: "<imageDir>",
      }),
    };

    await encode((episode as unknown) as Episode);

    const ffmpegArgs = commandRunner.run.getCall(0).args[1];
    expect(ffmpegArgs).toMatchInlineSnapshot(`
      Array [
        "-thread_queue_size",
        "512",
        "-framerate",
        "25",
        "-i",
        "<workDir>/<imageDir>/%06d.png",
        "-thread_queue_size",
        "512",
        "-i",
        "<workDir>/<vobFileName>",
        "-map",
        "0:v:0",
        "-c:v",
        "libx265",
        "-crf",
        "20",
        "-profile:v",
        "main10",
        "-preset",
        "slower",
        "-vf",
        "format=yuv420p10le",
        "-map",
        "1:a?",
        "-c:a",
        "copy",
        "-map",
        "1:s?",
        "-disposition:s:0",
        "0",
        "-c:s",
        "copy",
        "-default_mode",
        "infer_no_subs",
        "-max_interleave_delta",
        "0",
        "-loglevel",
        "error",
        "-stats",
        "-y",
        "<workDir>/<outputFileName>",
      ]
    `);
  });
});
