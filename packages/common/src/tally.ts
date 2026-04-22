import { hash } from "./utils.js";

type TSL5TallyColor = 0 | 1 | 2 | 3;
export type TSL5TallyType = "rh_tally" | "text_tally" | "lh_tally";

export type TallyIndex = number;
export type MixEngineIndex = number;
export type TallyMEId = string; // `${mixEngineIndex}-${inputIndex}`

export const getTallyMEId = (mixEngineIndex: MixEngineIndex, inputIndex: TallyIndex): TallyMEId => {
  return `${mixEngineIndex}-${inputIndex}`;
};

export const parseTallyMEId = (tallyMEId: TallyMEId): [MixEngineIndex, TallyIndex] => {
  const [mixEngineIndexStr, inputIndexStr] = tallyMEId.split("-");
  return [parseInt(mixEngineIndexStr), parseInt(inputIndexStr)];
}

export type TallyBus = "program" | "preview";

export enum TallyColor {
  OFF = 0,
  RED = 1,
  GREEN = 2,
  AMBER = 1 | 2,
}

export type TallyColorName = keyof typeof TallyColor;

export function tallyColorToValue(color: TallyColor|TSL5TallyColor|TallyColorName): TSL5TallyColor {
  if (typeof color === "number") {
    if (color >= 0 && color <= 3) {
      return color;
    } else {
      throw new Error(`Invalid tally color value: ${color}`);
    }
  } else if (typeof color === "string") {
    const colorValue = TallyColor[color as TallyColorName];
    if (colorValue !== undefined) {
      return colorValue;
    } else {
      throw new Error(`Invalid tally color name: ${color}`);
    }
  }
  switch (color) {
    case TallyColor.OFF:
      return 0;
    case TallyColor.RED:
      return 1;
    case TallyColor.GREEN:
      return 2;
    case TallyColor.AMBER:
      return 3;
    default:
      throw new Error(`Invalid tally color: ${color}`);
  }
}

export function tallyColorToName(color: TallyColor|TSL5TallyColor): TallyColorName {
  switch (color) {
    case TallyColor.OFF:
      return "OFF";
    case TallyColor.RED:
      return "RED";
    case TallyColor.GREEN:
      return "GREEN";
    case TallyColor.AMBER:
      return "AMBER";
    default:
      throw new Error(`Invalid tally color: ${color}`);
  }
}

export function tallyColorNameToTallyColor(name: TallyColorName): TallyColor {
  switch (name) {
    case "OFF":
      return TallyColor.OFF;
    case "RED":
      return TallyColor.RED;
    case "GREEN":
      return TallyColor.GREEN;
    case "AMBER":
      return TallyColor.AMBER;
    default:
      throw new Error(`Invalid tally color name: ${name}`);
  }
}

export interface Tally {
  inputIndex: TallyIndex;
  mixEngineIndex: MixEngineIndex;
  busses: TallyBus[];
  tallyColor: TallyColor;
  name: string;
}

export type TallyTSLRecords = Record<TallyMEId, Tally>;
export type TallyTSLRecordsWithActive = Record<TallyMEId, TallyTSLMapItemWithActive[]>;

export interface TallyTSLMapItemNoId {
  tallyId: TallyMEId;
  bus: TallyBus;
  screen: number;
  index: number;
  tallyType: TSL5TallyType;
  tallyColor: TallyColor;
  id?: string;
  name?: string;
}

export interface TallyTSLMapItem extends TallyTSLMapItemNoId {
  id: string;
}

export interface TallyTSLMapItemWithActive extends TallyTSLMapItem {
  active: boolean;
}

export type TallyTSLMapActiveState = Record<string, boolean>;

export function generateTSLMapItemId(item: TallyTSLMapItemNoId|TallyTSLMapItem): string {
  return hash([
    item.tallyId,
    item.bus,
    item.screen,
    item.index,
    item.tallyType,
    tallyColorToValue(item.tallyColor),
  ]);
}

export function createTSLMapItem(item: TallyTSLMapItemNoId): TallyTSLMapItem {
  const id = generateTSLMapItemId(item);
  if (item.id && item.id !== id) {
    throw new Error(`Provided TSL map item ID ${item.id} does not match generated ID ${id}`);
  }
  return {
    ...item,
    id,
  };
}

export type TallyTSLMap = TallyTSLMapItem[];
export type TallyTSLMapWithActive = Record<TallyMEId, TallyTSLMapItemWithActive[]>;
