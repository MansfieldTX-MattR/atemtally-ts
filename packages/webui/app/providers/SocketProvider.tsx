"use client";

import { useState, useRef, useEffectEvent, createContext, useContext, useEffect } from "react";

import { createTrpcWSClient, type TrpcWSClientType, type WSClientType } from "./trpcWSClient";

interface Client {
  trpcClient: TrpcWSClientType;
  wsClient: WSClientType;
}

interface SocketContextType {
  socket: TrpcWSClientType | null;
  isConnected: boolean;
  wsClient: WSClientType | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

type ClientState = 'disconnected' | 'connected';

export default function SocketProvider({socketUri, children }: { socketUri: string, children: React.ReactNode }) {
  const [clientState, setClientState] = useState<ClientState>('disconnected');
  const [client, setClient] = useState<Client | null>(null);
  const wsClientRef = useRef<WSClientType | null>(null);


  const clearClientCallback = useEffectEvent(() => {
    wsClientRef.current = null;
    setClient(null);
    setClientState('disconnected');
  });

  const closeCurrentClientCallback = useEffectEvent(() => {
    const currentWsClient = wsClientRef.current;
    wsClientRef.current = null;
    if (currentWsClient) {
      void currentWsClient.close();
    }
    setClient(null);
    setClientState('disconnected');
  });

  useEffect(() => {
    let isMounted = true;

    async function createClient(): Promise<void> {
      const [trpcClient, wsClient] = await createTrpcWSClient(socketUri, {
        onOpen: () => {
          console.log("WebSocket connection opened");
          setClientState('connected');
        },
        onClose: () => {
          console.log("WebSocket connection closed");
          clearClientCallback();
        },
        onError: (evt) => {
          console.error("WebSocket error", evt);
          clearClientCallback();
        }
      });

      if (!isMounted) {
        void wsClient.close();
        return;
      }

      wsClientRef.current = wsClient;
      console.log("WebSocket client created", { trpcClient, wsClient });
      setClient({ trpcClient, wsClient });
      setClientState('connected');
    }

    createClient().catch((error) => {
      console.error("Error creating WebSocket client", error);
      clearClientCallback();
    });

    return () => {
      isMounted = false;
      closeCurrentClientCallback();
    };
  }, [socketUri]);


  const trpcClient = client?.trpcClient || null;
  const wsClient = client?.wsClient || null;
  const connected = clientState === 'connected';

  return (
    <SocketContext.Provider value={{ socket: trpcClient, wsClient, isConnected: connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
