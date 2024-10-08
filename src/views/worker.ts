import * as Comlink from 'comlink';

class MyWorker {
  async init() {
    console.log('Worker initialized');
  }

  logSomething(as: number) {
    console.log('Worker logSomething', as);
  }
}

Comlink.expose(MyWorker);