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

interface ApiDeps {
  tslMapper: TallyTSLMapper;
  tslBridge: TallyTSLBridge;
}

export function createApp(deps: ApiDeps): Express {
  const app = express();
  app.use(express.json());

  app.post("/api/tally/map", (req: Request<{}, MapTallyResponse | ErrorResponse, MapTallyRequestBody>, res: Response<MapTallyResponse | ErrorResponse>) => {
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

  app.get("/api/tally/map", (_req: Request, res: Response<GetTSLMapResponse>) => {
    const tslMap = deps.tslMapper.getTSLMap();
    const mapObj: GetTSLMapResponse = {};
    for (const [key, value] of tslMap.entries()) {
      mapObj[key] = value;
    }
    res.json(mapObj);
  });

  app.post("/api/tally/off", (_req: Request, res: Response<SendAllOffResponse>) => {
    deps.tslBridge.sendAllTalliesOff();
    res.json({ ok: true });
  });

  return app;
}

export function startServer(app: Express, port: number): Promise<Server> {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`API server listening on port ${port}`);
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
