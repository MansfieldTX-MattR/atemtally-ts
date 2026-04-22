"use client";

import { useState, useCallback, createContext, useContext } from "react";

import { getTrpcWSClient, type TrpcWSClientType } from "./trpcWSClient";


interface SocketContextType {
  socket: TrpcWSClientType;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);


export default function SocketProvider({socketUri, children }: { socketUri: string, children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const connectedCallback = useCallback((state: boolean) => {
    setConnected(state);
  }, [setConnected]);
  const [trpcClient, wsClient] = getTrpcWSClient(
    socketUri,
    {
      onOpen: () => {
        console.log("WebSocket connection opened");
        connectedCallback(true);
      },
      onClose: () => {
        console.log("WebSocket connection closed");
        connectedCallback(false);
      },
      onError: () => {
        console.error("WebSocket error");
        connectedCallback(false);
      }
    }
  );

  return (
    <SocketContext.Provider value={{ socket: trpcClient, isConnected: connected }}>
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
