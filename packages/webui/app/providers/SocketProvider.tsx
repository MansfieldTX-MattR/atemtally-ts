"use client";

import { useState, useEffect, createContext, useContext } from "react";

import type { ClientSocketType, ServerToClientEvents } from "@/lib/wstypes";
import getSocket from "./io";


interface SocketContextType {
  socket: ClientSocketType;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);


export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const socket = getSocket();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (socket === null) {
      return;
    }
    const handleConnect = () => {
      console.log("Socket connected");
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setConnected(false);
    };
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [setConnected]);

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


export function useTallyMessageListener(handler: ServerToClientEvents["tallyMessage"]) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;
    // console.log(`Setting up socket listener for tally messages. isConnected: ${isConnected}`);
    socket.on("tallyMessage", handler);

    return () => {
      // console.log("Cleaning up socket listener for tally messages");
      socket.off("tallyMessage", handler);
    };
  }, [socket, isConnected, handler]);
}
