declare module 'express-rate-limit-redis' {
  import { Store } from 'express-rate-limit';

  interface RedisStoreOptions {
    sendCommand: (...args: string[]) => Promise<any>;
    prefix?: string;
  }

  function RedisStore(options: RedisStoreOptions): Store;

  export = RedisStore;
}