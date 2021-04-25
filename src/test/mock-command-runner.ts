import sinon from "sinon";

import { CommandRunner } from "../util/node/command-runner";

export class MockCommandRunner implements Required<CommandRunner> {
  child = sinon.stub() as any;
  messages = sinon.stub().returns([]) as any;
  run = sinon.stub().resolves();
}
