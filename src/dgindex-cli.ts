import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { generateDgIndex } from "./tools/dgindex";

async function main(episode: Episode): Promise<void> {
  await generateDgIndex(episode);
}

startCli(main);
