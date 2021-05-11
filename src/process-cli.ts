import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { preprocess } from "./tools/preprocess";
import { generateDgIndex } from "./tools/dgindex";
import { upscaleVeai } from "./tools/veai";
import { mergeChaptersTimecodes } from "./tools/mkvmerge";

async function main(episode: Episode): Promise<void> {
  // TODO: check if the target files exist at each step
  await generateDgIndex(episode);
  await preprocess(episode);
  await upscaleVeai(episode);
  await mergeChaptersTimecodes(episode);
}

startCli(main);
