import type { Tally as TSL5Tally, TallyType } from "tsl-umd-v5";
import type {
  TallyMEId,
  TallyTSLMapItem,
} from "@atemtally/common";
import { TallyColor } from "@atemtally/common";


export interface TallyTSLMapItemWithActive extends TallyTSLMapItem {
  active: boolean;
}

export type TallyTSLMapWithoutActive = Record<TallyMEId, TallyTSLMapItem[]>;
export type TallyTSLMapWithActive = Record<TallyMEId, TallyTSLMapItemWithActive[]>;

export type TallyMap<T extends TSL5Tally> = Map<number, Map<number, T>>; // Map of screen to Map of index to Tally
