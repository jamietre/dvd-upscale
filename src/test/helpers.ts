import sinon from "sinon";

export function asSinonStubs<T>(obj: T): sinon.SinonStubbedInstance<T> {
  return (obj as unknown) as sinon.SinonStubbedInstance<T>;
}

export function cast<T>(obj: any): T {
  return obj as T;
}
