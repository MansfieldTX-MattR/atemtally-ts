"use client";

import { useState, useEffect, createContext, useContext } from "react";

import type { ClientSocketType, ServerToClientEvents } from "@atemtally/common"
import getSocket from "./io";


interface SocketContextType {
  socket: ClientSocketType;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);


export default function SocketProvider({socketUri, children }: { socketUri: string, children: React.ReactNode }) {
  const socket = getSocket(socketUri);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (socket.connected) {
      console.log("Socket already connected");
      socket.disconnect();
      socket.connect();
    }
    console.log("Setting up socket connection listeners");
    const handleConnect = () => {
      console.log("Socket connected");
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setConnected(false);
    };
    const handleError = (error: Error) => {
      console.error("Socket error: ", error);
    }
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.disconnect();
    };
  }, [socketUri, socket, setConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected: connected }}>
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

export function useMapItemsActiveState(handler: ServerToClientEvents["mapItemsActiveChanged"]) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !socket) return;
    socket.on("mapItemsActiveChanged", handler);

    return () => {
      socket.off("mapItemsActiveChanged", handler);
    };
  }, [socket, isConnected, handler]);
}
