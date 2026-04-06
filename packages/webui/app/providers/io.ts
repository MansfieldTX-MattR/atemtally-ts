'use client';
import { io } from "socket.io-client";
import type { ClientSocketType } from "@/lib/wstypes";


const createSocket = (): ClientSocketType => {
  const socket: ClientSocketType = io({
    path: "/api/socket/io",
    addTrailingSlash: false,
  });
  return socket;
};


let _socket: ClientSocketType | null = null;

export default function getSocket(): ClientSocketType {
  if (_socket === null) {
    _socket = createSocket();
  }
  return _socket;
};
