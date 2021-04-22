import { Logger } from "../lib/logger/logger";

export class LogReader {
  constructor(private options: { logger: Logger }) {}
  messageReceived = (msg: string) => {
    this.options.logger.info(msg);
  };
}
