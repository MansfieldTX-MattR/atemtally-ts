"use client";
import { createTRPCClient, createWSClient, wsLink } from '@trpc/client';

import type { AppRouter } from '@atemtally/server';


export type TrpcWSClientType = ReturnType<typeof createTRPCClient<AppRouter>>;
export type WSClientType = ReturnType<typeof createTrpcWSClientInner>;



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
  onError?: (evt?: Event) => void;
}


type ConnectState = 'disconnected' | 'connecting' | 'connected' | 'error';
const CONNECTION_TIMEOUT_MS = 10000;

const createTrpcWSClientInner = (websocketUri: string, callbacks?: WSClientCallbacks, onConnectStateChange?: (state: ConnectState) => void) => {
  const wsClient = createWSClient({
    url: websocketUri,
    onOpen: () => {
      if (onConnectStateChange) onConnectStateChange('connected');
      if (callbacks?.onOpen) callbacks.onOpen();
    },
    onClose: () => {
      if (onConnectStateChange) onConnectStateChange('disconnected');
      if (callbacks?.onClose) callbacks.onClose();
    },
    onError: (evt) => {
      if (onConnectStateChange) onConnectStateChange('error');
      if (callbacks?.onError) callbacks.onError(evt);
    },
  });
  return wsClient;
}

export const createTrpcWSClient = async (websocketUri: string, callbacks?: WSClientCallbacks): Promise<[TrpcWSClientType, WSClientType]> => {
  async function createConnectedClient(): Promise<WSClientType> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let wsClient: WSClientType | null = null;

      const finalize = (action: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeoutId);
        action();
      };

      const timeoutId = window.setTimeout(() => {
        finalize(() => {
          if (wsClient) {
              void wsClient.close();
          }
          reject(new Error(`Timed out connecting to ${websocketUri}`));
        });
      }, CONNECTION_TIMEOUT_MS);

      wsClient = createTrpcWSClientInner(websocketUri, callbacks, (state) => {
        if (state === 'connected') {
          finalize(() => {
            if (wsClient) {
              resolve(wsClient);
            }
          });
        } else if (state === 'error') {
          finalize(() => {
            reject(new Error(`WebSocket connection error to ${websocketUri}`));
          });
        } else if (state === 'disconnected') {
          finalize(() => {
            reject(new Error(`WebSocket connection closed before connecting to ${websocketUri}`));
          });
        }
      });
    });
  }
  const wsClient = await createConnectedClient();
  const trpcWSClient = createClient(wsClient);
  return [trpcWSClient, wsClient];
}
