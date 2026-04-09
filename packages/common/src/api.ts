import type {
  TallyIndex,
  MixEngineIndex,
  TallyBus,
  TallyMEId,
  TallyColor,
  TallyTSLMapItem,
  TSL5TallyType,
  TallyTSLMapItemWithActive,
} from "./tally.js";

export interface MapTallyRequestBody {
  inputIndex: TallyIndex;
  mixEngineIndex: MixEngineIndex;
  busses?: TallyBus[];
  color: TallyColor;
  name?: string;
  bus: TallyBus;
  tallyType?: TSL5TallyType;
}

export type MapTallyResponse = TallyTSLMapItem;

export type GetTSLMapResponse = Record<TallyMEId, TallyTSLMapItemWithActive[]>;

export interface SendAllOffResponse {
  ok: boolean;
}

export interface ErrorResponse {
  error: string;
}
