import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { deinterlace } from "./tools/deinterlace";
import { generateDgIndex } from "./tools/dgindex";
import { upscaleVeai } from "./tools/veai";

async function main(episode: Episode): Promise<void> {
  // TODO: check if the target files exist at each step
  await generateDgIndex(episode);
  await deinterlace(episode);
  await upscaleVeai(episode);
}

startCli(main);
