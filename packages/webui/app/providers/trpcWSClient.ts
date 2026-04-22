"use client";
import { createTRPCClient, createWSClient, wsLink } from '@trpc/client';

import type { AppRouter } from '@atemtally/server';


export type TrpcWSClientType = ReturnType<typeof createTRPCClient<AppRouter>>;
export type WSClientType = ReturnType<typeof createWSClient>;


let _trpcWSClient: TrpcWSClientType | null = null;
let _wsClient: WSClientType | null = null;
let _websocketUri: string | null = null;

function createClient(wsClient: WSClientType) {
  return createTRPCClient<AppRouter>({
    links: [
      wsLink<AppRouter>({
        client: wsClient,
      }),
    ],
  });
}

interface WSClientCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}


export const getTrpcWSClient = (websocketUri: string, callbacks?: WSClientCallbacks): [TrpcWSClientType, WSClientType] => {
  if (_trpcWSClient !== null && _wsClient !== null && _websocketUri === websocketUri) {
    return [_trpcWSClient, _wsClient];
  }
  const wsClient = createWSClient({
    url: websocketUri,
    onOpen: callbacks?.onOpen,
    onClose: callbacks?.onClose,
    onError: callbacks?.onError,
  });
  _trpcWSClient = createClient(wsClient);
  _wsClient = wsClient;
  _websocketUri = websocketUri;
  return [_trpcWSClient, wsClient];
};
