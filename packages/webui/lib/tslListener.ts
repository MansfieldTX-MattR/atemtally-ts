"use server";
import { debug as createDebug } from "debug";
import { EventEmitter } from "node:events";
import type { TallyMessage as TSL5TallyMessage, Tally as TSL5Tally, TallyType } from "tsl-umd-v5";
import TSL5 from "tsl-umd-v5";

import { EnvConfigDefaults } from "@atemtally/common";
import { TallyColor } from "@atemtally/common";

const debug = createDebug("atemtally:webui:tallyEventEmitter");
createDebug.enable("atemtally:webui:*");

const TSL_PORT = process.env.NEXTJS_TSL_PORT ? Number(process.env.NEXTJS_TSL_PORT) : EnvConfigDefaults.NEXTJS_TSL_PORT;


interface TallyListenerEvents {
  tallyMessage: [message: TSL5TallyMessage];
  talliesChanged: [tallies: TSL5Tally[]];
}

export class TallyListener extends EventEmitter<TallyListenerEvents> {
  private tslInstance: TSL5;
  private _allTallies: Map<number, Map<number, TSL5Tally>>; // Map of screen to Map of index to Tally
  constructor() {
    super();
    this.tslInstance = new TSL5();
    this._allTallies = new Map();
    this.tslInstance.on("message", async (msg: TSL5TallyMessage) => {
      debug("Received TSL5 message: ");
      this.emit("tallyMessage", msg);
      const { screen, index } = msg;
      let talliesForScreen: Map<number, TSL5Tally>;
      let statesChanged = false;
      if (this._allTallies.has(screen)) {
        talliesForScreen = this._allTallies.get(screen)!;
      } else {
        talliesForScreen = new Map();
        this._allTallies.set(screen, talliesForScreen);
      }
      if (talliesForScreen.has(index)) {
        const existingTally = talliesForScreen.get(index)!;
        const [mergedTally, changed] = mergeTSL5Tally(existingTally, msg);
        if (!changed) {
          return; // No change in tally state, so skip emitting
        }
        talliesForScreen.set(index, mergedTally);
      } else {
        talliesForScreen.set(index, msg);
        statesChanged = true;
      }
      if (statesChanged) {
        this.emit("talliesChanged", Array.from(talliesForScreen.values()));
      }
    });
    this.tslInstance.listenUDP(TSL_PORT);
    debug(`Started TSL listener on UDP port ${TSL_PORT}`);
  }
  get allTallies() {
    return this._allTallies;
  }

}


function mergeTSL5Tally(existing: TSL5Tally, update: TSL5Tally): [TSL5Tally, boolean] {
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
