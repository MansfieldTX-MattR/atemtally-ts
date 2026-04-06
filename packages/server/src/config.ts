import fs from "fs";

import type {
  TallyTSLMap,
  HostPort,
} from "@atemtally/common";



interface IConfig {
  atemAddress: string;
  tallyMap: TallyTSLMap;
  tsl5Clients: HostPort[];
}

export class Config implements IConfig {
  atemAddress: string;
  tallyMap: TallyTSLMap;
  tsl5Clients: HostPort[];
  private configFilename: string | null;

  constructor(atemAddress: string, tallyMap: TallyTSLMap, tsl5Clients: HostPort[], configFilename: string | null = null) {
    this.atemAddress = atemAddress;
    this.tallyMap = tallyMap;
    this.tsl5Clients = tsl5Clients;
    this.configFilename = configFilename;
  }

  get hasConfigFile(): boolean {
    return this.configFilename !== null;
  }

  static fromJSON(json: string, configFilename: string | null = null): Config {
    const obj = JSON.parse(json);
    return new Config(obj.atemAddress, obj.tallyMap, obj.tsl5Clients, configFilename);
  }

  static fromFile(filename: string): Config {
    const json = fs.readFileSync(filename, "utf-8");
    return Config.fromJSON(json, filename);
  }

  toJSON(): string {
    return JSON.stringify({
      atemAddress: this.atemAddress,
      tallyMap: this.tallyMap,
      tsl5Clients: this.tsl5Clients,
    }, null, 2);
  }

  saveToFile(filename: string): void {
    fs.writeFileSync(filename, this.toJSON(), "utf-8");
    this.configFilename = filename;
  }

  save(): void {
    if (!this.configFilename) {
      throw new Error("No config filename specified");
    }
    this.saveToFile(this.configFilename);
  }
}
