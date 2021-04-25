import { container } from "../test/di";
import { FFMpeg } from "./ffmpeg";

describe("ffmpeg", () => {
  it("multiple inputs", async () => {
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
    expect(ff.getArgs()).toMatchInlineSnapshot(`
      Array [
        "-i",
        "input-file-1",
        "-i",
        "input-file-2",
        "-y",
        "-map",
        "0:v:0",
        "-c:v",
        "libx265",
        "-crf",
        "20",
        "-profile:v",
        "main10",
        "-preset",
        "slow",
        "-map",
        "1:a?",
        "-c:a",
        "copy",
        "-y",
      ]
    `);
  });
});
