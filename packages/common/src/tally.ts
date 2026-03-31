
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

export function tallyColorToValue(color: TallyColor): TSL5TallyColor {
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


export interface Tally {
  inputIndex: TallyIndex;
  mixEngineIndex: MixEngineIndex;
  busses: TallyBus[];
  color: TallyColor;
  name: string;
}


export interface TallyTSLMapItem {
  tallyId: TallyMEId;
  bus: TallyBus;
  screen: number;
  index: number;
  tallyType: TSL5TallyType;
  tallyColor: TallyColor;
}
export type TallyTSLMap = TallyTSLMapItem[];
