export type LogFn = (message: string) => void;

export class Logger {
  constructor(private logger: Required<Logger>) {}
  debug(message: string) {
    this.logger.debug(message);
  }
  info(message: string) {
    this.logger.info(message);
  }
  warn(message: string) {
    this.logger.warn(message);
  }
  error(message: string) {
    this.logger.error(message);
  }
}
