import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { mergeChaptersTimecodes } from "./tools/mkvmerge";

async function main(episode: Episode): Promise<void> {
  await mergeChaptersTimecodes(episode);
}

startCli(main);
