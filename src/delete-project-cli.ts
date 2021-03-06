import { startCli } from "./lib/cli";
import { Episode } from "./lib/episode";
import { deleteProjectFiles } from "./tools/delete-files";

async function main(episode: Episode): Promise<void> {
  await deleteProjectFiles(episode);
}

startCli(main);
