import { NextApiResponse } from "next";
import { Server as NetServer, Socket as NetSocket } from "net";
import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

import type { TallyMessage as TSL5TallyMessage, Tally as TSL5Tally } from "tsl-umd-v5";
import type { TallyTSLMapWithActive } from "@/lib/tallyUtils";



export interface ServerToClientEvents { // aka EmitEvents
  tallyMessage: (message: TSL5TallyMessage) => void;
  talliesChanged: (tallies: TSL5Tally[]) => void;
  tallyMapUpdate: (map: TallyTSLMapWithActive) => void;
  pong: () => void;
}

export interface ClientToServerEvents {  // aka ListenEvents
  ping: () => void;
}

export type InterServerEvents = object  // aka ServerSideEvents

export type SocketData = object;

// Aliases to match the naming convention used in Socket.IO type definitions.
// The interfaces above match the Socket.IO documentation, but not the actual type parameters.
type EmitEvents = ServerToClientEvents;
type ListenEvents = ClientToServerEvents;
type ServerSideEvents = InterServerEvents;


export type Constructor<T> = new (...args: object[]) => T;

export type SocketIOServerConstructor = Constructor<SocketIOServer<ListenEvents, EmitEvents, ServerSideEvents, SocketData>>;
export type SocketIOServerType = SocketIOServer<ListenEvents, EmitEvents, ServerSideEvents, SocketData>;

export type SocketType = Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>;

export type ClientSocketConstructor = Constructor<ClientSocket<ListenEvents, EmitEvents>>;
export type ClientSocketType = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

export type NextApiResponseServerIo = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io: SocketIOServerType;
    };
  };
};
