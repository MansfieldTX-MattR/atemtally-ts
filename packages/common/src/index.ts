
export type {
  Tally,
  TallyIndex,
  MixEngineIndex,
  TallyMEId,
  TallyBus,
  TallyTSLMapItem,
  TallyTSLMap,
} from "./tally.js";

export * from "./tally.js";

export type {
  MapTallyRequestBody,
  MapTallyResponse,
  GetTSLMapResponse,
  SendAllOffResponse,
  ErrorResponse,
} from "./api.js";

export * from "./api.js";


export interface HostPort {
  host: string;
  port: number;
}
