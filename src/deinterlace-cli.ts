import { startCli } from "./lib/cli";
import { Context } from "./lib/context";
import { Episode } from "./lib/episode";
import { deinterlace } from "./tools/deinterlace";

async function main(context: Context, episode: Episode): Promise<void> {
  await deinterlace(context, episode);
}

startCli(main);
