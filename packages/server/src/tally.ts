import { debug as createDebug } from "debug";
import { EventEmitter } from "node:events";
import type { AtemState, Atem } from "atem-connection";
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
  TallyTSLMapItemNoId,
  TallyTSLMapItem,
  TallyTSLMapActiveState,
  HostPort,
} from "@atemtally/common";
import {
  createTSLMapItem,
  TallyColor,
  getTallyMEId,
  parseTallyMEId,
  tallyColorToValue
} from "@atemtally/common";
import type { Config } from "./config";

const debug = createDebug("atemtally:tally");

type TallyWithoutName = Omit<Tally, "name">;

export function getTallyColors(atem: Atem, meIndex: MixEngineIndex): Map<TallyIndex, TallyWithoutName> {
  const previewInputs = new Set(atem.listVisibleInputs('preview', meIndex));
  const programInputs = new Set(atem.listVisibleInputs('program', meIndex));
  const allInputs = new Set([...previewInputs, ...programInputs]);

  return new Map(Array.from(allInputs).map(input => {
    const busses: TallyBus[] = [];
    let color: TallyColor = TallyColor.OFF;
    if (programInputs.has(input)) {
      color |= TallyColor.RED;
      busses.push("program");
    }
    if (previewInputs.has(input)) {
      color |= TallyColor.GREEN;
      busses.push("preview");
    }
    return [input, {
      inputIndex: input,
      mixEngineIndex: meIndex,
      busses,
      color,
    }];
  }));
}

interface TallyCollectionEvents {
  tallyUpdated: [Tally[]];
}

export class TallyCollection extends EventEmitter <TallyCollectionEvents> {
  private tallies: Map<TallyMEId, Tally>;
  private _initialized: boolean;

  constructor() {
    super();
    this.tallies = new Map();
    this._initialized = false;
  }

  get initialized(): boolean {
    return this._initialized;
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
        // debug(`Initialized tally with key ${key}: `, tally);
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
    for (let meIndex = 0; meIndex < meCount; meIndex++) {
      this._updateTallies(atem, meIndex);
    }
    this._initialized = true;
  }

  reset() {
    if (!this._initialized) {
      return;
    }
    for (const tally of this.tallies.values()) {
      tally.color = TallyColor.OFF;
      tally.busses = [];
    }
    this._initialized = false;
    this.emit('tallyUpdated', Array.from(this.tallies.values()));
  }

  getKeysForME(meIndex: MixEngineIndex): TallyMEId[] {
    return Array.from(this.tallies.keys()).filter(key => {
      const [keyMEIndex, keyInputIndex] = parseTallyMEId(key);
      return keyMEIndex === meIndex;
    });
  }

  updateTallies(atem: Atem, ...meIndex: MixEngineIndex[]) {
    if (!this._initialized) {
      return;
    }
    for (const index of meIndex) {
      this._updateTallies(atem, index);
    }
  }

  _updateTallies(atem: Atem, meIndex: MixEngineIndex) {
    const newTallies = getTallyColors(atem, meIndex);
    const existingKeys = new Set(this.getKeysForME(meIndex));
    const missingKeys = new Set(existingKeys);
    const updatedTallies: Tally[] = [];
    for (const [inputIndex, tally] of newTallies.entries()) {
      const key: TallyMEId = getTallyMEId(meIndex, inputIndex);
      missingKeys.delete(key);
      const existingTally = this.tallies.get(key);
      if (!this.tallies.has(key) || existingTally === undefined) {
        continue;
      }
      if (existingTally.color !== tally.color) {
        if (existingTally.inputIndex !== tally.inputIndex || existingTally.mixEngineIndex !== tally.mixEngineIndex || existingTally.mixEngineIndex !== meIndex) {
          throw new Error(`Tally key mismatch for existing tally ${existingTally.inputIndex}, ${existingTally.mixEngineIndex} and new tally ${tally.inputIndex}, ${tally.mixEngineIndex}`);
        }
        existingTally.color = tally.color;
        existingTally.busses = tally.busses;
        updatedTallies.push(existingTally);
      }
    }
    const updatedKeys = new Set(updatedTallies.map(tally => getTallyMEId(tally.mixEngineIndex, tally.inputIndex)));
    if (updatedKeys.size !== updatedTallies.length) {
      throw new Error("Updated keys should be unique");
    }
    for (const key of missingKeys) {
      if (updatedKeys.has(key)) {
        continue;
      }
      const tally = this.tallies.get(key);
      if (tally) {
        const [mixEngineIndex, inputIndex] = parseTallyMEId(key);
        if (tally.inputIndex !== inputIndex || tally.mixEngineIndex !== mixEngineIndex || mixEngineIndex !== meIndex) {
          throw new Error(`Tally key mismatch for existing tally with key ${key} and tally with input index ${tally.inputIndex} and ME index ${tally.mixEngineIndex}`);
        }
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
    const keysForME = this.getKeysForME(meIndex);
    return keysForME.map(key => {
      const tally = this.tallies.get(key);
      if (!tally) {
        throw new Error(`Tally not found for key ${key}`);
      }
      return tally;
    });
  }
}



// export type TallyTSLMap = {
//   [tallyId: TallyMEId]: TallyTSLMapItem;
// }



interface TallyTSLMapperEvents {
  mappingUpdated: [tallyId: TallyMEId, tslMapItems: TallyTSLMapItem[]];
  mapItemsActiveChanged: [TallyTSLMapActiveState];
}

export class TallyTSLMapper extends EventEmitter<TallyTSLMapperEvents> {
  private tallyToTSLMap: Map<TallyMEId, TallyTSLMapItem[]>;
  private tallyToTSLMapById: Record<string, TallyTSLMapItem>;
  private tslMapItemsActive: TallyTSLMapActiveState;
  private config: Config | null;

  constructor(config: Config | null = null) {
    super();
    this.tallyToTSLMap = new Map();
    this.tallyToTSLMapById = {};
    this.tslMapItemsActive = {};
    this.config = config;
    if (config) {
      this.loadTSLMap(config.tallyMap);
    }
  }

  get(tallyId: TallyMEId): TallyTSLMapItem[] | undefined {
    return this.tallyToTSLMap.get(tallyId);
  }

  getById(id: string): TallyTSLMapItem | undefined {
    return this.tallyToTSLMapById[id];
  }

  getItemActive(id: string): boolean {
    return this.tslMapItemsActive[id] || false;
  }

  private setItemsActive(activeStates: TallyTSLMapActiveState) {
    let anyStateChanged = false;
    for (const id in activeStates) {
      const newState = activeStates[id];
      const currentState = this.getItemActive(id);
      if (currentState !== newState) {
        this.tslMapItemsActive[id] = newState;
        anyStateChanged = true;
      }
    }
    // debug("Set TSL map items active states: ", this.tslMapItemsActive);
    if (anyStateChanged) {
      this.emit("mapItemsActiveChanged", this.tslMapItemsActive);
    }
  }

  has(tallyId: TallyMEId): boolean {
    return this.tallyToTSLMap.has(tallyId);
  }

  hasId(id: string): boolean {
    return id in this.tallyToTSLMapById;
  }

  buildTSLTallies(tally: Tally): TSL5Tally {
    const tallyId = getTallyMEId(tally.mixEngineIndex, tally.inputIndex);
    const tslMapItems = this.tallyToTSLMap.get(tallyId);
    if (!tslMapItems || tslMapItems.length === 0) {
      throw new Error(`No TSL mapping found for tally with ID ${tallyId}`);
    }
    const tslDisplays: TSL5TallyDisplay[] = [];
    const activeIds: TallyTSLMapActiveState = {};
    for (const tslMapItem of tslMapItems) {
      const tallyOn = tally.busses.includes(tslMapItem.bus);
      const tallyColor = tallyOn ? tslMapItem.tallyColor : TallyColor.OFF;
      const tallyDisplay: TSL5TallyDisplay = {
        rh_tally: tslMapItem.tallyType === "rh_tally" ? tallyColorToValue(tallyColor) : 0,
        text_tally: tslMapItem.tallyType === "text_tally" ? tallyColorToValue(tallyColor) : 0,
        lh_tally: tslMapItem.tallyType === "lh_tally" ? tallyColorToValue(tallyColor) : 0,
      };
      activeIds[tslMapItem.id] = tallyOn;
      tslDisplays.push(tallyDisplay);
    }
    const combinedDisplay: Record<TSL5TallyType, TSL5TallyColor> = {
      rh_tally: 0,
      text_tally: 0,
      lh_tally: 0,
    };
    for (const display of tslDisplays) {
      for (const type of ["rh_tally", "text_tally", "lh_tally"] as TSL5TallyType[]) {
        if (display[type] && display[type] > 0) {
          combinedDisplay[type] = display[type];
        }
      }
    }
    this.setItemsActive(activeIds);
    return {
      screen: tslMapItems[0].screen,
      index: tslMapItems[0].index,
      display: {
        rh_tally: combinedDisplay.rh_tally,
        text_tally: combinedDisplay.text_tally,
        lh_tally: combinedDisplay.lh_tally,
        brightness: 3,
        text: tally.name,
      }
    };
  }

  mapTallyToTSL(tally: Tally, bus: TallyBus, tallyType?: TSL5TallyType): TallyTSLMapItem {
    const { mixEngineIndex, inputIndex, color } = tally;
    const tallyId = getTallyMEId(mixEngineIndex, inputIndex);
    if (tallyType === undefined) {
      tallyType = bus === "program" ? "rh_tally" : "lh_tally";
    }
    const tslMapItem: TallyTSLMapItemNoId = {
      tallyId,
      bus,
      screen: mixEngineIndex,
      index: inputIndex,
      tallyType,
      tallyColor: color,
    };
    let items = this.tallyToTSLMap.get(tallyId);
    if (!items) {
      items = [];
      this.tallyToTSLMap.set(tallyId, items);
    }
    const tslMapItemWithId = createTSLMapItem(tslMapItem);
    if (this.tallyToTSLMapById[tslMapItemWithId.id]) {
      throw new Error(`TSL map item with ID ${tslMapItemWithId.id} already exists`);
    }
    items.push(tslMapItemWithId);
    this.tallyToTSLMapById[tslMapItemWithId.id] = tslMapItemWithId;
    this.tslMapItemsActive[tslMapItemWithId.id] = false;
    if (this.config && this.config.hasConfigFile) {
      this.config.tallyMap = Array.from(this.tallyToTSLMap.values()).flat();
      this.config.save();
    }
    return tslMapItemWithId;
  }

  unmapTallyFromTSL(id: string): boolean {
    const mapItem = this.tallyToTSLMapById[id];
    if (!mapItem) {
      return false;
    }
    const { tallyId } = mapItem;
    const items = this.tallyToTSLMap.get(tallyId);
    if (!items) {
      return false;
    }
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    items.splice(index, 1);
    delete this.tallyToTSLMapById[id];
    delete this.tslMapItemsActive[id];
    if (this.config && this.config.hasConfigFile) {
      this.config.tallyMap = Array.from(this.tallyToTSLMap.values()).flat();
      this.config.save();
    }
    return true;
  }

  getTSLMap(): Map<TallyMEId, TallyTSLMapItem[]> {
    return this.tallyToTSLMap;
  }

  loadTSLMap(tslMap: (TallyTSLMapItemNoId|TallyTSLMapItem)[]) {
    for (const mapItem of tslMap) {
      const { tallyId } = mapItem;
      if (!this.tallyToTSLMap.has(tallyId)) {
        this.tallyToTSLMap.set(tallyId, []);
      }
      const items = this.tallyToTSLMap.get(tallyId);
      if (!items) {
        throw new Error(`Failed to initialize TSL map for tally ID ${tallyId}`);
      }
      const mapItemWithId = createTSLMapItem(mapItem);
      if (this.tallyToTSLMapById[mapItemWithId.id]) {
        throw new Error(`Duplicate TSL map item ID ${mapItemWithId.id} found in config`);
      }
      items.push(mapItemWithId);
      this.tallyToTSLMapById[mapItemWithId.id] = mapItemWithId;
      this.tslMapItemsActive[mapItemWithId.id] = false;
    }
    debug(`Loaded TSL map with ${this.tallyToTSLMap.size} items`);
  }
}


export class TallyTSLBridge {
  private mapper: TallyTSLMapper;
  private tsl: TSL5;
  private clients: Set<HostPort>;
  private config: Config | null;

  constructor(mapper: TallyTSLMapper, clients?: HostPort[], config: Config | null = null) {
    this.mapper = mapper;
    this.tsl = new TSL5();
    this.clients = new Set(clients);
    this.config = config;
    if (this.config) {
      for (const client of this.config.tsl5Clients) {
        this.clients.add(client);
      }
    }
  }

  addClient(client: HostPort) {
    this.clients.add(client);
  }

  removeClient(client: HostPort) {
    this.clients.delete(client);
  }

  async handleTallyUpdate(updatedTallies: Tally[]): Promise<void> {
    const talliesToSend = updatedTallies.filter(tally => {
      const tallyId = getTallyMEId(tally.mixEngineIndex, tally.inputIndex);
      return this.mapper.has(tallyId);
    });
    await this.sendMultipleTallies(talliesToSend);
  }

  async resendTallies(tallies: Tally[]): Promise<void> {
    const talliesToResend = tallies.filter(tally => {
      const tallyId = getTallyMEId(tally.mixEngineIndex, tally.inputIndex);
      return this.mapper.has(tallyId);
    });
    await this.sendMultipleTallies(talliesToResend);
  }

  async sendMultipleTallies(tallies: Tally[], forceAllOff?: boolean): Promise<void> {
    const promises: Promise<void>[] = [];
    const tslTallies = tallies.map(tally => this.mapper.buildTSLTallies(tally));
    if (forceAllOff) {
      for (const tslTally of tslTallies) {
        tslTally.display = {
          rh_tally: 0,
          text_tally: 0,
          lh_tally: 0,
        };
      }
    }
    // `TSL.sendTallyUDP` can only send tallies for one screen at a time, so we need to group tallies by screen before sending
    const talliesByScreen = Map.groupBy(tslTallies, (tally) => tally.screen);
    const messagesByScreen = Array.from(talliesByScreen.values(),
      (tallies) => this.tsl.constructPackets(tallies)
    );
    debug(`Sending ${tallies.length} tallies grouped into ${messagesByScreen.length} screens to ${this.clients.size} clients`);
    for (const client of this.clients) {
      for (const message of messagesByScreen) {
        promises.push(this.tsl.sendPacketsUDP(client.host, client.port, message));
      }
    }
    await Promise.all(promises);
  }

  async sendTally(tally: Tally): Promise<void> {
    await this.sendMultipleTallies([tally]);
  }

  async sendAllTalliesOff() {
    const talliesToSend: Tally[] = Array.from(this.mapper.getTSLMap().keys()).filter(tallyId => {
      return this.mapper.has(tallyId);
    }).map(tallyId => {
      const [mixEngineIndex, inputIndex] = parseTallyMEId(tallyId);
      return {
        mixEngineIndex,
        inputIndex,
        busses: [],
        color: TallyColor.OFF,
        name: "",
      } as Tally;
    });
    await this.sendMultipleTallies(talliesToSend, true);
  }
}
