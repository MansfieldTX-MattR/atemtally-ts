import { debug as createDebug } from "debug";
import { createHTTPServer } from '@trpc/server/adapters/standalone';

import type { ApiContext } from './index';
import { appRouter } from './trpcRouter';
import { setApiContext, createContext } from './trpcContext';
import { EnvConfigDefaults, ensureNumber } from '@atemtally/common';

const debug = createDebug("atemtally:trpcServer");

const API_PORT = ensureNumber(process.env.ATEM_API_PORT, EnvConfigDefaults.ATEM_API_PORT);


export function createApp(context: ApiContext) {
  setApiContext(context);
  return createHTTPServer({
    router: appRouter,
    createContext,
  });
}

export async function startServer(app: ReturnType<typeof createApp>, port: number = API_PORT) {
  const server = app.listen(port);
  debug(`API server is running on http://localhost:${port}`);
  return server;
}

export async function stopServer(server: ReturnType<typeof createApp>){
  return new Promise<void>((resolve, reject) => async () => {
    server.close((err: Error|undefined) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
