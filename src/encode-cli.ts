import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { encode } from "./tools/encode";

async function main(episode: Episode): Promise<void> {
  await encode(episode);
}

startCli(main);
