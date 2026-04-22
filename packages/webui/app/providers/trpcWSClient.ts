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

export const destroyTrpcWSClient = async () => {
  if (_wsClient) {
    await _wsClient.close();
  }
  _trpcWSClient = null;
  _wsClient = null;
  _websocketUri = null;
}

interface WSClientCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (evt?: Event) => void;
}


export const getTrpcWSClient = (websocketUri: string, callbacks?: WSClientCallbacks): [TrpcWSClientType, WSClientType] => {
  if (_trpcWSClient !== null && _wsClient !== null && _websocketUri === websocketUri) {
    return [_trpcWSClient, _wsClient];
  }
  const uriChanged = _websocketUri !== null && _websocketUri !== websocketUri;
  if (uriChanged) {
    destroyTrpcWSClient();
  }
  const wsClient = createWSClient({
    url: websocketUri,
    onOpen: callbacks?.onOpen,
    onClose: () => {
      if (callbacks?.onClose) {
        callbacks.onClose();
      }
      destroyTrpcWSClient();
    },
    onError: (evt) => {
      if (callbacks?.onError) {
        callbacks.onError(evt);
      }
      destroyTrpcWSClient();
    },
  });
  _trpcWSClient = createClient(wsClient);
  _wsClient = wsClient;
  _websocketUri = websocketUri;
  return [_trpcWSClient, wsClient];
};
