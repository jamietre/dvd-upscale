import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";

async function main(episode: Episode): Promise<void> {
  await encodeImages(episode);
}

startCli(main);
