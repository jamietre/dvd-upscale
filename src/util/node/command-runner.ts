import { ChildProcess, spawn, SpawnOptions } from "child_process";

import { Readable } from "stream";
import { createDeferred } from "../promises";
import { assertIsDefined } from "../types";

export type LogReader = (text: string) => void;
export type RunCommandOptions = {
  /**
   * A log reader; otherwise, all output is returned
   */
  logReader?: LogReader;
  messageHandler?: (message: string) => void;
  showCommand?: boolean;
} & SpawnOptions;

const stdoutLogReader = (message: string) => process.stdout.write(message);
export class CommandRunner {
  private _child: ChildProcess | undefined;
  private _messages: string[] | undefined;
  get child(): ChildProcess {
    assertIsDefined(this._child);
    return this._child;
  }
  get messages(): string[] {
    assertIsDefined(this._messages);
    return this.messages;
  }

  /**
   * Run a command in a subshell. If no messageHandler is provided, all messages
   * will be returned in "messages" property of the return object
   */
  async run(command: string, args: string[] = [], options: RunCommandOptions = {}): Promise<void> {
    const errors: string[] = [];
    const { logReader, messageHandler, ...nodeOptions } = options;
    const reader = logReader || stdoutLogReader;

    function consumeOutput(stream: Readable, handler: (message: Buffer) => void) {
      stream.on("readable", () => {
        let data: Buffer;
        while ((data = stream.read())) {
          handler(data);
        }
      });
    }
    if (options.showCommand) {
      console.log(`${command} ${formatArgs(args)}`);
    }
    const child = spawn(command, args, nodeOptions);
    const deferred = createDeferred<string[]>();

    if (child.stdout) {
      consumeOutput(child.stdout, msg => reader(msg.toString()));
    }
    if (child.stderr) {
      consumeOutput(child.stderr, msg => {
        errors.push(msg.toString());
        reader(msg.toString());
      });
    }

    child.on("error", (err: Error) => {
      deferred.reject(err);
    });
    child.on("exit", code => {
      if (code === 0) {
        deferred.resolve();
        return;
      }
      deferred.reject(new Error(`Error ${code}: ` + errors.join("\n")));
    });
    if (messageHandler) {
      child.on("message", messageHandler);
    }
    this._child = child;
    return deferred.promise().then(messages => {
      this._messages = messages;
    });
  }
}

export async function runCommandInteractive(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("error", (err: Error) => {
      reject(err);
    });
    child.on("exit", code => {
      const final = code === 0 ? resolve : reject;
      final();
    });
  });
}

function formatArgs(args: string[]): string {
  return args.map(e => (e.includes(" ") || e.includes(":") ? `"${e}"` : e)).join(" ");
}
