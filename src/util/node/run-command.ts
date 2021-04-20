import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { Readable } from 'stream';
import { createDeferred } from '../promises';
import { cleanSplitLines } from '../strings';

export type LogReader = (text: string) => void;
export type RunCommandOptions = {
  /**
   * A log reader; otherwise, all output is returned
   */
  logReader?: LogReader;
  messageHandler?: (message: string) => void;
} & SpawnOptions;

/**
 * Run a command in a subshell. DEPRECATED - please use runCommand2
 */
export async function runCommand(
  command: string,
  args: string[] = [],
  options: RunCommandOptions = {}
): Promise<string[]> {
  const out = runCommand2(command, args, options);
  return out.messages;
}

/**
 * Run a command in a subshell. If no messageHandler is provided, all messages
 * will be returned in "messages" property of the return object
 */
export function runCommand2(
  command: string,
  args: string[] = [],
  options: RunCommandOptions = {}
): {
  child: ChildProcess;
  messages: Promise<string[]>;
} {
  const output: string[] = [];
  const { logReader, messageHandler, ...nodeOptions } = options;
  const reader =
    logReader ||
    ((data: string) => {
      output.push(data);
    });

  function consumeOutput(stream: Readable, handler: (message: Buffer) => void) {
    stream.on('readable', () => {
      let data: Buffer;
      while ((data = stream.read())) {
        handler(data);
      }
    });
  }
  const child = spawn(command, args, nodeOptions);
  const deferred = createDeferred<string[]>();
  consumeOutput(child.stdout!, (data) =>
    processCommandOutputToReader(data, reader)
  );
  consumeOutput(child.stderr!, (data) =>
    processCommandOutputToReader(data, reader)
  );

  child.on('error', (err: Error) => {
    deferred.reject(err);
  });
  child.on('exit', (code) => {
    if (code === 0) {
      deferred.resolve(cleanSplitLines(output.join('\n')));
      return;
    }
    deferred.reject(new Error(output.join('\n')));
  });
  if (messageHandler) {
    child.on('message', messageHandler);
  }
  return { child, messages: deferred.promise() };
}

export async function runCommandInteractive(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
    child.on('exit', (code) => {
      const final = code === 0 ? resolve : reject;
      final();
    });
  });
}

function processCommandOutputToReader(text: Buffer, reader: LogReader) {
  cleanSplitLines(text.toString()).forEach(reader);
}
