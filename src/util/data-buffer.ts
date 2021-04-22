import { cleanSplitLines } from "./strings";

const nanosecondsPerMillisecond = 1000000n;

export class DataBuffer {
  private data: string[] = [];
  private lastMessageTime = 0n;
  constructor(private options: { maxTimeBetweenLinesMs: number; emit: (msg: string) => void }) {}
  write = (messages: string | Buffer) => {
    const lines = cleanSplitLines(messages.toString());
    while (lines.length > 1) {
      const line = lines.shift() as string;
      this.options.emit(line);
    }
    const message = lines[0] || "";
    if (message.length === 0) {
      return;
    }

    const { data } = this;
    const curtime = this.getCurTime();
    if (
      this.lastMessageTime &&
      curtime - this.lastMessageTime > this.options.maxTimeBetweenLinesMs
    ) {
      this.flush();
    }
    this.lastMessageTime = curtime;
    data.push(message);
  };
  flush() {
    const data = [...this.data];
    this.data = [];
    this.options.emit(data.join(""));
  }
  getCurTime() {
    return process.hrtime.bigint() / nanosecondsPerMillisecond;
  }
}
