import { startCli } from "./lib/cli";
import { Context } from "./lib/context";
import { Episode } from "./lib/episode";
import { generateDgIndex } from "./tools/dgindex";

async function main(context: Context, episode: Episode): Promise<void> {
  await generateDgIndex(context, episode);
}

startCli(main);
