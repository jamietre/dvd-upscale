import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { deinterlace } from "./tools/deinterlace";

async function main(episode: Episode): Promise<void> {
  await deinterlace(episode);
}

startCli(main);
