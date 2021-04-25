import { Config } from "../lib/config";
import { container } from "../test/di";
import { asSinonStubs } from "../test/helpers";
import { CommandRunner } from "../util/node/command-runner";
import { DgIndex } from "./dgindex";

describe("dgindex", () => {
  const commandRunner = container.resolve(CommandRunner);
  const dgIndex = new DgIndex(container.resolve(Config), commandRunner);
  it("command line with default options", async () => {
    dgIndex.run;
    await dgIndex.run({
      sourceFile: "foo.vob",
      outputRoot: "out",
    });
    const command = asSinonStubs(commandRunner).run.getCall(0).args;
    expect(command).toMatchInlineSnapshot(`
      Array [
        "/path/to/degindex",
        Array [
          "-ia",
          "5",
          "-fo",
          "0",
          "-hide",
          "-exit",
          "-om",
          "2",
          "-i",
          "foo.vob",
          "-o",
          "out",
        ],
      ]
    `);
  });
});
