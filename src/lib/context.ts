import { Config } from "./config";
import { Logger } from "./logger/logger";
import { Profile } from "./profile";

type ContextOptions = {
  config: Config;
  profile: Profile;
};

/**
 * A context for operations in a given project
 */
export class Context {
  config: Config;
  profile: Profile;
  logger: Logger;
  constructor(options: ContextOptions) {
    this.config = options.config;
    this.profile = options.profile;
    this.logger = new Logger(console);
  }
}
