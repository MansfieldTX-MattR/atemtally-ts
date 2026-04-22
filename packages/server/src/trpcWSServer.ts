import { debug as createDebug } from "debug";
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';

import { EnvConfigDefaults, ensureNumber } from '@atemtally/common';
import { appRouter } from './trpcRouter';
import { createContext } from './trpcContext';

const debug = createDebug("atemtally:wsServer");


const WS_PORT = ensureNumber(process.env.ATEM_API_WS_PORT, EnvConfigDefaults.ATEM_API_WS_PORT);


export function createWebSocketServer(){
  const wss = new WebSocketServer({ port: WS_PORT });
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
    keepAlive: {
      enabled: true,
      pingMs: 30000,
      pongWaitMs: 5000,
    },
  });
  debug(`WebSocket server is running on ws://localhost:${WS_PORT}`);
  return { wss, handler };
}

export async function stopWebSocketServer(ctx: ReturnType<typeof createWebSocketServer>) {
  ctx.handler.broadcastReconnectNotification();
  ctx.wss.close();
}
