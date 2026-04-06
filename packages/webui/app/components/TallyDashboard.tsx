"use client";

import { useState, useCallback } from "react";
import type { TallyMessage as TSL5TallyMessage, Tally as TSL5Tally } from "tsl-umd-v5";
import type {
  MapTallyRequestBody,
  TallyTSLMapItem,
} from "@atemtally/common";
import type { TallyTSLMapWithActive, TallyTSLMapWithoutActive, TallyMap, TallyTSLMapItemWithActive } from "../../lib/tallyUtils";
import { isTallyMapItemActive, mergeTSL5Tally, updateTallyMapActiveStates } from "../../lib/tallyUtils";
import { getTSLMap, mapTallyToTSL, sendAllTalliesOff } from "../actions";
import { useTallyMessageListener } from "../providers/SocketProvider";
import TSLMapTable from "./TSLMapTable";
import MapTallyForm from "./MapTallyForm";
import SendAllOff from "./SendAllOff";

interface TallyDashboardProps {
  initialMap: TallyTSLMapWithoutActive;
}


const updateTSLMap = (newMap: TallyTSLMapWithoutActive, allTallies: TallyMap<TSL5Tally>): TallyTSLMapWithActive => {
  // const itemsWithActive = newMap.map(item => ({ ...item, active: isTallyMapItemActive(item) }));
  const mapWithActive: TallyTSLMapWithActive = Object.fromEntries(
    Object.entries(newMap).map(([screen, items]) => [
      screen,
      items.map((item) => ({
        ...item,
        active: isTallyMapItemActive(item, allTallies),
      })),
    ] as [string, TallyTSLMapItemWithActive[]])
  );
  return mapWithActive;
};

function getAllTalliesCount(tallies: TallyMap<TSL5Tally>): number {
  let count = 0;
  for (const screenMap of tallies.values()) {
    count += screenMap.size;
  }
  return count;
}
function getAllTalliesArray(tallies: TallyMap<TSL5Tally>): TSL5Tally[] {
  const allTalliesArray: TSL5Tally[] = [];
  for (const screenMap of tallies.values()) {
    allTalliesArray.push(...screenMap.values());
  }
  return allTalliesArray;
}


export default function TallyDashboard({ initialMap }: TallyDashboardProps) {
  const [tslMap, setTslMap] = useState<TallyTSLMapWithActive>(Object.fromEntries(
    Object.entries(initialMap).map(([screen, items]) => [
      screen,
      items.map((item) => ({
        ...item,
        active: isTallyMapItemActive(item, new Map()), // Initially set all to inactive; will be updated on first socket update or manual refresh
      })),
    ] as [string, TallyTSLMapItemWithActive[]])
  ));
  const [allTallies, setAllTallies] = useState<TallyMap<TSL5Tally>>(new Map());
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTallyMessage = useCallback((message: TSL5TallyMessage) => {
    // console.log("Received tally message from socket: ", message);
    let talliesChanged = false;
    // Create a 2-level copy of the current tallies map
    const newTallies: TallyMap<TSL5Tally> = new Map(
      Array.from(allTallies.entries()).map(([screen, indexMap]) => [screen, new Map(indexMap.entries())])
    )
    // const newTallies: TallyMap<TSL5Tally> = new Map();
    // for (const [screen, indexMap] of allTallies.entries()) {
    //   newTallies.set(screen, new Map(indexMap));
    // }
    // debug("Received TSL5 message: ");
    const { screen, index } = message;
    let talliesForScreen: Map<number, TSL5Tally>;
    if (newTallies.has(screen)) {
      talliesForScreen = newTallies.get(screen)!;
    } else {
      talliesForScreen = new Map();
      newTallies.set(screen, talliesForScreen);
      talliesChanged = true;
    }
    if (talliesForScreen.has(index)) {
      const existingTally = talliesForScreen.get(index)!;
      const [mergedTally, changed] = mergeTSL5Tally(existingTally, message);
      if (!changed) {
        return; // No change in tally state, so skip emitting
      }
      talliesForScreen.set(index, mergedTally);
      talliesChanged = true;
    } else {
      talliesForScreen.set(index, message);
      talliesChanged = true;
    }
    if (talliesChanged) {
      setAllTallies(newTallies);
      console.log(`New tallies map (${getAllTalliesCount(newTallies)}): `, getAllTalliesArray(newTallies));
    }
    // Update active state of all map items for this screen/index
    const [updatedMap, statesChanged] = updateTallyMapActiveStates(screen, index, tslMap, newTallies);
    if (statesChanged) {
      setTslMap(updatedMap);
    }
  }, [tslMap, allTallies]);

  useTallyMessageListener(handleTallyMessage);

  async function handleRefreshMap() {
    setLoading(true);
    try {
      const data = await getTSLMap();
      setTslMap(updateTSLMap(data, allTallies));
      // setStatus("Map refreshed");
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleMapTally(body: MapTallyRequestBody): Promise<TallyTSLMapItem | null> {
    setLoading(true);
    try {
      const result = await mapTallyToTSL(body);
      if ("error" in result) {
        setStatus(`Error: ${result.error}`);
        return null;
      }
      setStatus("Tally mapped");
      const updated = await getTSLMap();
      setTslMap(updateTSLMap(updated, allTallies));
      return result;
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAllOff() {
    setLoading(true);
    try {
      const result = await sendAllTalliesOff();
      if ("error" in result) {
        setStatus(`Error: ${result.error}`);
      } else {
        setStatus("All tallies sent off");
      }
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {status && (
        <div className="rounded bg-zinc-100 px-4 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {status}
        </div>
      )}
      <TSLMapTable tslMap={tslMap} loading={loading} onRefresh={handleRefreshMap} />
      <MapTallyForm loading={loading} onSubmit={handleMapTally} />
      <SendAllOff loading={loading} onSendAllOff={handleSendAllOff} />
    </div>
  );
}
