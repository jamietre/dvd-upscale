import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { upscaleVeai } from "./tools/veai";

async function main(episode: Episode): Promise<void> {
  await upscaleVeai(episode);
}

startCli(main);
