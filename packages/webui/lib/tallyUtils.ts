import type { Tally as TSL5Tally, TallyType } from "tsl-umd-v5";
import type {
  TallyMEId,
  TallyTSLMapItem,
} from "@atemtally/common";
import { TallyColor, tallyColorToValue } from "@atemtally/common";


export interface TallyTSLMapItemWithActive extends TallyTSLMapItem {
  active: boolean;
}

export type TallyTSLMapWithoutActive = Record<TallyMEId, TallyTSLMapItem[]>;
export type TallyTSLMapWithActive = Record<TallyMEId, TallyTSLMapItemWithActive[]>;

export type TallyMap<T extends TSL5Tally> = Map<number, Map<number, T>>; // Map of screen to Map of index to Tally


export function isTallyMapItemActive<T extends TSL5Tally>(item: TallyTSLMapItem, allTallies: TallyMap<T>): boolean {
  // const [mixEngineIndex, inputIndex] = parseTallyMEId(item.tallyId);
  const screenTallies = allTallies.get(item.screen);
  if (!screenTallies) {
    return false;
  }
  const tally = screenTallies.get(item.index);
  if (!tally || !tally.display) {
    return false;
  }
  const tallyColor = tallyColorToValue(tally.display[item.tallyType]);
  return tallyColor === tallyColorToValue(item.tallyColor);
}

export function mergeTSL5Tally(existing: TSL5Tally, update: TSL5Tally): [TSL5Tally, boolean] {
  if (existing.screen !== update.screen || existing.index !== update.index) {
    throw new Error("Cannot merge TSL5 tallies with different screen/index");
  }
  function mergeTallyColor(tallyType: TallyType): TallyColor {
    // const existingColor = existing.display ? existing.display[tallyType] || TallyColor.OFF : TallyColor.OFF;
    const updateColor = update.display ? update.display[tallyType] || TallyColor.OFF : TallyColor.OFF;
    // return existingColor | updateColor;
    return updateColor;
  }
  const mergedDisplay: Record<TallyType, TallyColor> = {
    rh_tally: TallyColor.OFF,
    text_tally: TallyColor.OFF,
    lh_tally: TallyColor.OFF,
  };
  let changed = false;
  for (const tallyType of Object.keys(mergedDisplay) as TallyType[]) {
    const mergedColor = mergeTallyColor(tallyType);
    mergedDisplay[tallyType] = mergedColor;
    if (mergedColor !== (existing.display ? existing.display[tallyType] || TallyColor.OFF : TallyColor.OFF)) {
      changed = true;
    }
  }
  return [
    {
      screen: existing.screen,
      index: existing.index,
      display: mergedDisplay,
    },
    changed,
  ];
}


export function updateTallyMapActiveStates<T extends TSL5Tally>(
  screen: number, index: number, tallyToTSLMap: TallyTSLMapWithActive, allTallies: TallyMap<T>
): [TallyTSLMapWithActive, boolean] {
  let anyItemUpdatedOverall = false;
  for (const [tallyMEId, mapItems] of Object.entries(tallyToTSLMap)) {
    let anyItemUpdated = false;
    const updatedMapItems = mapItems.map(item => {
      if (item.screen === screen && item.index === index) {
        const active = isTallyMapItemActive(item, allTallies);
        if (active !== item.active) {
          anyItemUpdated = true;
          // debug(`Tally ${item.tallyId} active state changed: ${item.active} -> ${active}`);
          return { ...item, active };
        }
      }
      return item;
    });
    if (anyItemUpdated) {
      tallyToTSLMap[tallyMEId] = updatedMapItems;
      anyItemUpdatedOverall = true;
    }
  }
  return [tallyToTSLMap, anyItemUpdatedOverall];
}
