"use client";

import { useState, useEffectEvent, createContext, useContext, useEffect } from "react";

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

type BuildState = 'isNull' | 'inProgress' | 'created';
type ClientState = 'disconnected' | 'connecting' | 'connected';

export default function SocketProvider({socketUri, children }: { socketUri: string, children: React.ReactNode }) {
  const [buildState, setBuildState] = useState<BuildState>('isNull');
  const [clientState, setClientState] = useState<ClientState>('disconnected');
  const [client, setClient] = useState<Client | null>(null);


  const clearClientCallback = useEffectEvent(() => {
    setClient(null);
    setBuildState('isNull');
    setClientState('disconnected');
  });

  useEffect(() => {
    if (buildState !== 'isNull') {
      return;
    }
    let ignore = false;

    async function createClient(): Promise<Client | null> {
      if (buildState !== 'isNull') {
        return null;
      }
      setBuildState('inProgress');
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
      console.log("WebSocket client created", { trpcClient, wsClient });
      return { trpcClient, wsClient };
    }
    if (!ignore) {
      createClient().then((newClient) => {
        if (newClient) {
          setClient(newClient);
          setClientState('connected');
          setBuildState('created');
        }
      }).catch((error) => {
        console.error("Error creating WebSocket client", error);
        clearClientCallback();
      });
    }
    return () => {
      ignore = true;
    };
  }, [socketUri, buildState, setBuildState, setClient, setClientState]);


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
