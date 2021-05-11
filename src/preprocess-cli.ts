import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { preprocess } from "./tools/preprocess";

async function main(episode: Episode): Promise<void> {
  await preprocess(episode);
}

startCli(main);
