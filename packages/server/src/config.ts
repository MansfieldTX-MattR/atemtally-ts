import fs from "fs";

import type {
  TallyTSLMapItem,
  TallyTSLMap,
  TallyBus,
  HostPort,
  TallyMEId,
} from "./tally";






interface IConfig {
  atemAddress: string;
  tallyMap: TallyTSLMap;
  tsl5Clients: HostPort[];
}

export class Config implements IConfig {
  atemAddress: string;
  tallyMap: TallyTSLMap;
  tsl5Clients: HostPort[];

  constructor(atemAddress: string, tallyMap: TallyTSLMap, tsl5Clients: HostPort[]) {
    this.atemAddress = atemAddress;
    this.tallyMap = tallyMap;
    this.tsl5Clients = tsl5Clients;
  }

  static fromJSON(json: string): Config {
    const obj = JSON.parse(json);
    return new Config(obj.atemAddress, obj.tallyMap, obj.tsl5Clients);
  }
  static fromFile(filename: string): Config {
    const json = fs.readFileSync(filename, "utf-8");
    return Config.fromJSON(json);
  }
}
