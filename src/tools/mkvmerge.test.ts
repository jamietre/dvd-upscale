import sinon from "sinon";

import { container } from "../test/di";
import { cast } from "../test/helpers";
import { CommandRunner } from "../util/node/command-runner";
import { MkvMerge } from "./mkvmerge";

describe("mkvmerge", () => {
  it("multiple inputs", async () => {
    const commandRunner = {
      run: sinon.stub(),
    };

    container.register(CommandRunner, { useValue: cast<CommandRunner>(commandRunner) });

    const mkvmerge = container.resolve(MkvMerge);
    await mkvmerge.run({
      inputFile: "<inputFile>",
      outputFile: "<outputFile>",
      chaptersFile: "<chaptersFile>",
      timestampsFile: "<timestampsFile>",
    });

    const args = commandRunner.run.getCall(0).args[1];
    expect(args).toMatchInlineSnapshot(`
      Array [
        "-o",
        "<outputFile>",
        "--timestamps",
        "0:<timestampsFile>",
        "--chapters",
        "<chaptersFile>",
        "<inputFile>",
      ]
    `);
  });
});
