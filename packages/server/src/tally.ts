
import { EventEmitter } from "node:events";
import type { AtemState, Atem, Input } from "atem-connection";
import { ExternalPortType } from "atem-connection/dist/enums";
import type {
  Tally as TSL5Tally,
  TallyColor as TSL5TallyColor,
  TallyType as TSL5TallyType,
  TallyDisplay as TSL5TallyDisplay,
} from "tsl-umd-v5";
import TSL5 from "tsl-umd-v5";

import type {
  Tally,
  TallyIndex,
  MixEngineIndex,
  TallyMEId,
  TallyBus,
  TallyTSLMapItem,
  TallyTSLMap,
  HostPort,
} from "@atemtally/common";
import {
  TallyColor,
  getTallyMEId,
  parseTallyMEId,
  tallyColorToValue
} from "@atemtally/common";


interface TallyWithoutName extends Omit<Tally, "name"> {}

export function getTallyColors(atem: Atem, meIndex: MixEngineIndex, filterInputs?: TallyIndex[]): Map<TallyIndex, TallyWithoutName> {
  const tallyColors: Map<TallyIndex, TallyColor> = new Map();
  const previewInputs = new Set(atem.listVisibleInputs('preview', meIndex));
  const programInputs = new Set(atem.listVisibleInputs('program', meIndex));
  const allInputs = new Set([...previewInputs, ...programInputs]);

  const result: Map<TallyIndex, TallyWithoutName> = new Map();

  for (const input of allInputs) {
    let tally: TallyColor = TallyColor.OFF;
    const busses: TallyBus[] = [];
    if (programInputs.has(input)) {
      tally |= TallyColor.RED;
      busses.push("program");
    }
    if (previewInputs.has(input)) {
      tally |= TallyColor.GREEN;
      busses.push("preview");
    }
    tallyColors.set(input, tally);
    result.set(input, {
      inputIndex: input,
      mixEngineIndex: meIndex,
      busses,
      color: tally,
    });
  }
  return result;
}

interface TallyCollectionEvents {
  tallyUpdated: [Tally[]];
}

export class TallyCollection extends EventEmitter <TallyCollectionEvents> {
  private tallies: Map<TallyMEId, Tally>;
  private initialized: boolean;

  constructor() {
    super();
    this.tallies = new Map();
    this.initialized = false;
  }

  initialize(atem: Atem, state: Readonly<AtemState>) {
    const meCount = state.info.mixEffects.length;
    const realInputs = Object.values(state.inputs).filter(input => input !== undefined);
    const sdiInputs = realInputs.filter(input => input?.externalPortType === ExternalPortType.SDI);
    const sdiInputNames = sdiInputs.map(input => input?.longName);
    const sdiInputIds = sdiInputs.map(input => input.inputId);
    sdiInputIds.sort((a, b) => a - b);
    // const tallies: Record<TallyMEId, Tally> = {};
    for (let meIndex = 0; meIndex < meCount; meIndex++) {
      for (const inputId of sdiInputIds) {
        const key: TallyMEId = getTallyMEId(meIndex, inputId);
        const name = sdiInputNames[sdiInputIds.indexOf(inputId)];
        const tally: Tally = {
          inputIndex: inputId,
          mixEngineIndex: meIndex,
          busses: [],
          color: TallyColor.OFF,
          name,
        };
        this.tallies.set(key, tally);
        // console.log(`Initialized tally with key ${key}: `, tally);
        if (!this.tallies.has(key)) {
          throw new Error(`Tally key ${key} not found after initialization`);
        }
      }
    }
    for (let meIndex = 0; meIndex < meCount; meIndex++) {
      for (const inputId of sdiInputIds) {
        const key: TallyMEId = getTallyMEId(meIndex, inputId);
        if (!this.tallies.has(key)) {
          throw new Error(`Tally key ${key} not found after initialization loop`);
        }
      }
    }
    this._updateTallies(atem, 0);
    this.initialized = true;
  }

  updateTallies(atem: Atem, meIndex: MixEngineIndex, filterInputs?: TallyIndex[]) {
    if (!this.initialized) {
      return;
    }
    this._updateTallies(atem, meIndex, filterInputs);
  }

  _updateTallies(atem: Atem, meIndex: MixEngineIndex, filterInputs?: TallyIndex[]) {
    const newTallies = getTallyColors(atem, meIndex, filterInputs);
    const existingKeys = new Set(this.tallies.keys());
    const missingKeys = new Set(existingKeys);
    const updatedTallies: Tally[] = [];
    for (const [inputIndex, tally] of newTallies.entries()) {
      const key: TallyMEId = getTallyMEId(meIndex, inputIndex);
      missingKeys.delete(key);
      const existingTally = this.tallies.get(key);
      if (!this.tallies.has(key) || existingTally === undefined) {
        // throw new Error(`Tally key ${key} not found in existing tallies`);
        continue;
      }
      if (existingTally.color !== tally.color) {
        if (existingTally.inputIndex !== tally.inputIndex || existingTally.mixEngineIndex !== tally.mixEngineIndex) {
          throw new Error(`Tally key mismatch for existing tally ${existingTally.inputIndex}, ${existingTally.mixEngineIndex} and new tally ${tally.inputIndex}, ${tally.mixEngineIndex}`);
        }
        // console.assert(existingTally.inputIndex === tally.inputIndex && existingTally.mixEngineIndex === tally.mixEngineIndex, "Tally key mismatch");
        existingTally.color = tally.color;
        existingTally.busses = tally.busses;
        updatedTallies.push(existingTally);
      }
    }
    const updatedKeys = new Set(updatedTallies.map(tally => getTallyMEId(tally.mixEngineIndex, tally.inputIndex)));
    console.assert(updatedKeys.size === updatedTallies.length, "Updated keys should be unique");
    for (const key of missingKeys) {
      if (updatedKeys.has(key)) {
        continue;
      }
      const tally = this.tallies.get(key);
      if (tally) {
        if (tally.color !== TallyColor.OFF) {
          tally.color = TallyColor.OFF;
          tally.busses = [];
          updatedTallies.push(tally);
        }
      }
    }
    if (updatedTallies.length > 0) {
      this.emit('tallyUpdated', updatedTallies);
    }
  }

  getTallies(meIndex?: MixEngineIndex): Tally[] {
    if (meIndex === undefined) {
      return Array.from(this.tallies.values());
    }
    return Array.from(this.tallies.values()).filter(tally => tally.mixEngineIndex === meIndex);
  }
}

type TSL5TallyDisplayPartial = {
  [Property in TSL5TallyType]?: TSL5TallyColor;
}


// export type TallyTSLMap = {
//   [tallyId: TallyMEId]: TallyTSLMapItem;
// }

export class TallyTSLMapper {
  private tallyToTSLMap: Map<TallyMEId, TallyTSLMapItem[]>;

  constructor() {
    this.tallyToTSLMap = new Map();
  }

  get(tallyId: TallyMEId): TallyTSLMapItem[] | undefined {
    return this.tallyToTSLMap.get(tallyId);
  }

  has(tallyId: TallyMEId): boolean {
    return this.tallyToTSLMap.has(tallyId);
  }

  buildTSLTallies(tally: Tally): TSL5Tally {
    const tallyId = getTallyMEId(tally.mixEngineIndex, tally.inputIndex);
    const tslMapItems = this.tallyToTSLMap.get(tallyId);
    if (!tslMapItems || tslMapItems.length === 0) {
      throw new Error(`No TSL mapping found for tally with ID ${tallyId}`);
    }
    const tslDisplays: TSL5TallyDisplay[] = [];
    for (const tslMapItem of tslMapItems) {
      const tallyOn = tally.busses.includes(tslMapItem.bus);
      const tallyColor = tallyOn ? tslMapItem.tallyColor : TallyColor.OFF;
      const tallyDisplay: TSL5TallyDisplay = {
        rh_tally: tslMapItem.tallyType === "rh_tally" ? tallyColorToValue(tallyColor) : 0,
        text_tally: tslMapItem.tallyType === "text_tally" ? tallyColorToValue(tallyColor) : 0,
        lh_tally: tslMapItem.tallyType === "lh_tally" ? tallyColorToValue(tallyColor) : 0,
      };
      tslDisplays.push(tallyDisplay);
    }
    const combinedDisplay: TSL5TallyDisplayPartial = {};
    for (const display of tslDisplays) {
      for (const type of ["rh_tally", "text_tally", "lh_tally"] as TSL5TallyType[]) {
        if (display[type] && display[type]! > 0) {
          combinedDisplay[type] = display[type];
        }
      }
    }
    return {
      screen: tslMapItems[0].screen,
      index: tslMapItems[0].index,
      display: {
        rh_tally: combinedDisplay.rh_tally || 0,
        text_tally: combinedDisplay.text_tally || 0,
        lh_tally: combinedDisplay.lh_tally || 0,
        brightness: 3,
        text: tally.name,
      }
    }
  }

  mapTallyToTSL(tally: Tally, bus: TallyBus, tallyType?: TSL5TallyType): TallyTSLMapItem {
    const { mixEngineIndex, inputIndex, color } = tally;
    const tallyId = getTallyMEId(mixEngineIndex, inputIndex);
    if (tallyType === undefined) {
      tallyType = bus === "program" ? "rh_tally" : "lh_tally";
    }
    const tslMapItem: TallyTSLMapItem = {
      tallyId,
      bus,
      screen: mixEngineIndex,
      index: inputIndex,
      tallyType,
      tallyColor: color,
    };
    this.tallyToTSLMap.set(tallyId, [tslMapItem]);
    return tslMapItem;
  }

  getTSLMap(): Map<TallyMEId, TallyTSLMapItem[]> {
    return this.tallyToTSLMap;
  }

  loadTSLMap(tslMap: TallyTSLMap) {
    for (const mapItem of tslMap) {
      const { tallyId } = mapItem;
      if (!this.tallyToTSLMap.has(tallyId)) {
        this.tallyToTSLMap.set(tallyId, []);
      }
      const items = this.tallyToTSLMap.get(tallyId);
      if (!items) {
        throw new Error(`Failed to initialize TSL map for tally ID ${tallyId}`);
      }
      items.push(mapItem);
      // this.tallyToTSLMap.get(tallyId)!.push(mapItem);
    }
    console.log(`Loaded TSL map with ${this.tallyToTSLMap.size} items:`, this.getTSLMap());
  }
}


export class TallyTSLBridge {
  private mapper: TallyTSLMapper;
  private tsl: TSL5;
  private clients: Set<HostPort>;

  constructor(mapper: TallyTSLMapper, clients?: HostPort[]) {
    this.mapper = mapper;
    this.tsl = new TSL5();
    this.clients = new Set(clients);
  }

  handleTallyUpdate(updatedTallies: Tally[]) {
    for (const tally of updatedTallies) {
      const tallyId = getTallyMEId(tally.mixEngineIndex, tally.inputIndex);
      // console.log(`Received tally update for ID ${tallyId}. Has id = ${this.mapper.has(tallyId)}: `, tally);
      if (this.mapper.has(tallyId)) {
        console.log(`Tally updated for ME${tally.mixEngineIndex} input ${tally.inputIndex} with color ${tally.color}, sending to TSL`);
        this.sendTally(tally);
      }
    }
  }

  sendTally(tally: Tally) {
    const tslTally = this.mapper.buildTSLTallies(tally);
    for (const client of this.clients) {
      // console.log(`Sending tally to client ${client.host}:${client.port}:`, tslTally);
      this.tsl.sendTallyUDP(client.host, client.port, tslTally);
    }
  }

  sendAllTalliesOff() {
    for (const tallyId of this.mapper.getTSLMap().keys()) {
      const mappedTallies = this.mapper.get(tallyId);
      if (!mappedTallies) {
        continue;
      }
      for (const mappedTally of mappedTallies) {
        const tslTally: TSL5Tally = {
          screen: mappedTally.screen,
          index: mappedTally.index,
          display: {
            rh_tally: 0,
            text_tally: 0,
            lh_tally: 0,
            brightness: 3,
            text: "",
          }
        };
        for (const client of this.clients) {
          console.log(`Sending tally off for tally ID ${tallyId} to client ${client.host}:${client.port}:`, tslTally);
          this.tsl.sendTallyUDP(client.host, client.port, tslTally);
        }
      }
    }
  }
}
