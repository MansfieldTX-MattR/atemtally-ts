import { Server as SocketIOServer } from "socket.io";
import type { Socket, ServerOptions  } from "socket.io";
import type {
  Socket as ClientSocket,
  ManagerOptions as ClientManagerOptions,
  SocketOptions as ClientSocketOptions
} from "socket.io-client";
import { io as ioConstructor } from "socket.io-client";
type IOContructorT = typeof ioConstructor;


import type {
  TallyTSLMapActiveState,
} from "./tally.js";
import type { Http2SecureServer, Http2Server } from "http2";
import type { Server as HTTPServer } from "http";
import { Server as HTTPSServer } from "https";


type TServerInstance = HTTPServer | HTTPSServer | Http2SecureServer | Http2Server;

export interface ServerToClientEvents { // aka EmitEvents
  mapItemsActiveChanged: (activeState: TallyTSLMapActiveState) => void;
  pong: () => void;
}

export interface ClientToServerEvents {  // aka ListenEvents
  ping: () => void;
}

export type InterServerEvents = object  // aka ServerSideEvents

export type SocketData = object;

// Aliases to match the naming convention used in Socket.IO type definitions.
// The interfaces above match the Socket.IO documentation, but not the actual type parameters.
export type EmitEvents = ServerToClientEvents;
export type ListenEvents = ClientToServerEvents;
export type ServerSideEvents = InterServerEvents;


type Constructor<T, P extends any[]> = new (...args: P) => T;

type SocketIOServerParameters = [srv?: TServerInstance | number, options?: Partial<ServerOptions>];
export type SocketIOServerConstructor = Constructor<SocketIOServer<ListenEvents, EmitEvents, ServerSideEvents, SocketData>, SocketIOServerParameters>;
export type SocketIOServerType = SocketIOServer<ListenEvents, EmitEvents, ServerSideEvents, SocketData>;

export type SocketType = Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>;


type ClientSocketOptionParam = Partial<ClientManagerOptions & ClientSocketOptions>;
type ClientSocketParameters = [string, ClientSocketOptionParam?] | [ClientSocketOptionParam?];

export type ClientSocketConstructor = Constructor<ClientSocket<ListenEvents, EmitEvents>, ClientSocketParameters>;
export type ClientSocketType = ClientSocket<ServerToClientEvents, ClientToServerEvents>;



function createInstance<T, P extends any[]>(cls: Constructor<T, P>, ...args: P): T {
  return new cls(...args);
}


/**
 * Factory function to create a Socket.IO server with the correct types.
 * @param cls - The Socket.IO server constructor (e.g. the `Server` class from `socket.io`).
 * @param args - The arguments to pass to the constructor (e.g. the HTTP server instance and options).
 * @returns A Socket.IO server instance with the correct types.
 */
export function createSocketIOServer(cls: SocketIOServerConstructor, ...args: SocketIOServerParameters): SocketIOServerType {
  return createInstance<SocketIOServerType, SocketIOServerParameters>(cls, ...args);
}


/**
  * Factory function to create a Socket.IO client socket with the correct types.
  * @param io - The Socket.IO client constructor (e.g. the `io` function from `socket.io-client`).
  * @param optsOrUri - Either the URI string or the options object for the socket connection.
  * @param opts - Optional options object if the first parameter is a URI string.
  * @returns A Socket.IO client socket instance with the correct types.
 */
export function createClientSocket(io: IOContructorT, [optsOrUri, opts]: ClientSocketParameters): ClientSocketType {
  if (typeof optsOrUri === "string") {
    return io(optsOrUri, opts);
  } else {
    return io(optsOrUri);
  }
}
