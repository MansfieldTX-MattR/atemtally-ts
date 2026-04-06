"use server";
import { debug as createDebug } from "debug";
import type { NextApiRequest } from "next";
import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { TallyMessage as TSL5TallyMessage, Tally as TSL5Tally } from "tsl-umd-v5";

import type {
  NextApiResponseServerIo,
  SocketIOServerType,
  SocketType,
  Constructor,
} from "@/lib/wstypes";
import { TallyListener } from "@/lib/tslListener";


const debug = createDebug("atemtally:webui:pages:api:socket:io");



function createInstance<T>(cls: Constructor<T>, ...args: object[]): T {
  return new cls(...args);
}

const ioHandler = async (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    debug("Initializing Socket.IO server...");
    const tallyListener = new TallyListener();
    const path = "/api/socket/io";
    const httpServer: HttpServer = res.socket.server as unknown as HttpServer;
    const io = createInstance<SocketIOServerType>(SocketIOServer, httpServer, {
      path: path,
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
    // const tallyEventEmitter = getTallyEventEmitter();
    // debug(`Got Tally event emitter with id: ${tallyEventEmitter.id}`);
    io.on("connection", (socket: SocketType) => {
      debug("New socket connection");
      socket.conn.once("upgrade", () => {
        debug("Socket connection upgraded: ", socket.conn.transport.name);
      });
      socket.on("ping", () => {
        // debug("Received ping from client, sending pong");
        socket.emit("pong");
      });
      const onTallyMessage = (message: TSL5TallyMessage) => {
        // debug("Emitting tally message to socket: ", message);
        socket.emit("tallyMessage", message);
      };

      const onTalliesChanged = (tallies: TSL5Tally[]) => {
        // debug("Emitting tallies changed to socket: ", tallies);
        socket.emit("talliesChanged", tallies);
      }

      tallyListener.on("tallyMessage", onTallyMessage);
      tallyListener.on("talliesChanged", onTalliesChanged);

      // tallyEventEmitter.bindToSocket(socket);
      // const onTallyMessage = (message: TSL5TallyMessage) => {
      //   debug("Emitting tally message to socket: ", message);
      //   socket.emit("tallyMessage", message);
      // };

      // const onTallyMapUpdated = (map: TallyTSLMapWithActive) => {
      //   debug("Emitting tally map update to socket: ", map);
      //   socket.emit("tallyMapUpdate", map);
      // };

      // tallyEventEmitter.on("tallyMessage", onTallyMessage);
      // tallyEventEmitter.on("tallyMapUpdated", onTallyMapUpdated);

      socket.on("disconnect", () => {
        debug("Socket disconnected");
        tallyListener.off("tallyMessage", onTallyMessage);
        tallyListener.off("talliesChanged", onTalliesChanged);

        // tallyEventEmitter.off("tallyMessage", onTallyMessage);
        // tallyEventEmitter.off("tallyMapUpdated", onTallyMapUpdated);
      });
    });
  }

  res.end();
};


export default ioHandler;
