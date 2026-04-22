"use client";

import { useState, createContext, useContext } from "react";

import { getTrpcWSClient, type TrpcWSClientType } from "./trpcWSClient";


interface SocketContextType {
  socket: TrpcWSClientType;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);


export default function SocketProvider({socketUri, children }: { socketUri: string, children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [trpcClient, wsClient] = getTrpcWSClient(
    socketUri,
    {
      onOpen: () => {
        console.log("WebSocket connection opened");
        setConnected(true);
      },
      onClose: () => {
        console.log("WebSocket connection closed");
        setConnected(false);
      },
      onError: () => {
        console.error("WebSocket error");
        setConnected(false);
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
