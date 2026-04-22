import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { initTRPC } from '@trpc/server';

import type { ApiContext } from '.';

let apiContext: ApiContext | null = null;

export function setApiContext(context: ApiContext) {
  apiContext = context;
}

export function getApiContext(): ApiContext {
  if (!apiContext) {
    throw new Error("ApiContext has not been set yet");
  }
  return apiContext;
}

export const createContext = (opts?: CreateHTTPContextOptions | CreateWSSContextFnOptions): ApiContext => { // eslint-disable-line @typescript-eslint/no-unused-vars
  return getApiContext();
}

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();


export const router = t.router;
export const publicProcedure = t.procedure;
