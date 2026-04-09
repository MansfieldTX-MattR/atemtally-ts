import { debug as createDebug } from "debug";
import express, { type Request, type Response } from "express";
import { type Server as HTTPServer, createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type { TallyTSLMapper, TallyTSLBridge } from "./tally";
import type {
  Tally,
  TallyColor,
  TallyTSLMapActiveState,
  MapTallyRequestBody,
  MapTallyResponse,
  GetTSLMapResponse,
  SendAllOffResponse,
  ErrorResponse,
  SocketType,
} from "@atemtally/common";
import { createSocketIOServer } from "@atemtally/common";

const debug = createDebug("atemtally:api");

interface ApiDeps {
  tslMapper: TallyTSLMapper;
  tslBridge: TallyTSLBridge;
}

interface ParamsDictionary {
    [key: string]: string | string[];
    [key: number]: string;
}

// Shorthand types for API request and response objects.
// ApiRequest moves RequestBody and ResponseBody to the front and allows for an optional ParamsDictionary type parameter.
type ApiRequest<TReqBody, TResBody, P = ParamsDictionary> = Request<P, TResBody | ErrorResponse, TReqBody>;
type ApiResponse<T> = Response<T | ErrorResponse>;


export function createApp(deps: ApiDeps): HTTPServer {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const io = createSocketIOServer( SocketIOServer, httpServer, {
    cors: {
      origin: "*",
    }
  });

  io.on("connection", (socket: SocketType) => {
    debug("New socket connection");
    socket.conn.once("upgrade", () => {
      debug("Socket connection upgraded: ", socket.conn.transport.name);
    });
    socket.on("ping", () => {
      debug("Received ping from client, sending pong");
      socket.emit("pong");
    });
    const onMapItemsActiveChanged = (activeState: TallyTSLMapActiveState) => {
      // debug("Emitting mapItemsActiveChanged to socket: ", activeState);
      socket.emit("mapItemsActiveChanged", activeState);
    };

    deps.tslMapper.on("mapItemsActiveChanged", onMapItemsActiveChanged);

    socket.on("disconnect", () => {
      debug("Socket disconnected, removing listeners");
      deps.tslMapper.off("mapItemsActiveChanged", onMapItemsActiveChanged);
    });
  });

  app.post("/api/tally/map", (req: ApiRequest<MapTallyRequestBody, MapTallyResponse>, res: ApiResponse<MapTallyResponse>) => {
    const { inputIndex, mixEngineIndex, busses, color, name, bus, tallyType } = req.body;
    if (inputIndex == null || mixEngineIndex == null || !bus || color == null) {
      res.status(400).json({ error: "Missing required fields: inputIndex, mixEngineIndex, bus, color" });
      return;
    }
    const tally: Tally = {
      inputIndex: Number(inputIndex),
      mixEngineIndex: Number(mixEngineIndex),
      busses: busses ?? [],
      color: Number(color) as TallyColor,
      name: name ?? "",
    };
    const result = deps.tslMapper.mapTallyToTSL(tally, bus, tallyType);
    res.json(result);
  });

  app.get("/api/tally/map", (_req: Request, res: ApiResponse<GetTSLMapResponse>) => {
    const tslMap = deps.tslMapper.getTSLMap();
    const mapObj: GetTSLMapResponse = {};
    for (const [key, value] of tslMap.entries()) {
      mapObj[key] = value.map((item) => ({
        ...item,
        active: deps.tslMapper.getItemActive(item.id),
      }));
    }
    res.json(mapObj);
  });

  app.post("/api/tally/off", (_req: Request, res: ApiResponse<SendAllOffResponse>) => {
    deps.tslBridge.sendAllTalliesOff();
    res.json({ ok: true });
  });

  return httpServer;
}

export function startServer(app: HTTPServer, port: number): Promise<HTTPServer> {
  return new Promise((resolve) => {
    app.listen(port, () => {
      debug(`API server listening on port ${port}`);
      resolve(app);
    });
  });
}

export function stopServer(server: HTTPServer): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
