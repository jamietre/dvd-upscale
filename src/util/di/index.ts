export interface Cotr<T> {
  new (...args: any): T;
}

export class DiContainer {
  private cotrs = new Map<string, Cotr<any>>();
  register(type: string, cotr: Cotr<any>) {
    this.cotrs.set(type, cotr);
  }
  resolve(type: string, ...args: any[]) {
    const Cotr = this.cotrs.get(type);
    if (Cotr === undefined) {
      throw new Error(`The type "${type}" hasn't been registered with the di container.`);
    }
    return new Cotr(...args);
  }
}
