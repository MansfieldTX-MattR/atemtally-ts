import { debug as createDebug } from "debug";
import express, { type Express, type Request, type Response } from "express";
import type { Server } from "node:http";
import type { TallyTSLMapper, TallyTSLBridge } from "./tally";
import type { Tally, TallyColor } from "@atemtally/common";
import type {
  MapTallyRequestBody,
  MapTallyResponse,
  GetTSLMapResponse,
  SendAllOffResponse,
  ErrorResponse,
} from "@atemtally/common";

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


export function createApp(deps: ApiDeps): Express {
  const app = express();
  app.use(express.json());

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
      mapObj[key] = value;
    }
    res.json(mapObj);
  });

  app.post("/api/tally/off", (_req: Request, res: ApiResponse<SendAllOffResponse>) => {
    deps.tslBridge.sendAllTalliesOff();
    res.json({ ok: true });
  });

  return app;
}

export function startServer(app: Express, port: number): Promise<Server> {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      debug(`API server listening on port ${port}`);
      resolve(server);
    });
  });
}

export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
