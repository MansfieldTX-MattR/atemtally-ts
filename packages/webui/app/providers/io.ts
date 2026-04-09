'use client';
import { io } from "socket.io-client";
import { type ClientSocketType, createClientSocket } from "@atemtally/common";


const createSocket = (uri: string): ClientSocketType => {
  return createClientSocket(io, [uri]);
};


let _socket: ClientSocketType | null = null;
let _websocketUri: string | null = null;

export default function getSocket(uri: string): ClientSocketType {
  if (_socket === null || _websocketUri !== uri) {
    console.log(`Creating new socket connection to ${uri}`);
    _socket = createSocket(uri);
    _websocketUri = uri;
  }
  return _socket;
};
