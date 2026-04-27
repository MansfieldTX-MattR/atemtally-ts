"use client";

import { useState, useEffect } from "react";
import { useSubscription } from '@trpc/tanstack-react-query';
import type {
  TallyTSLMapItem,
  TallyTSLMapItemNoId,
  TallyTSLMapActiveState,
  TallyTSLMapWithActive,
  TallyTSLMapItemWithActive,
} from "@atemtally/common";
import type { MapTallyRequestBody } from "@atemtally/server";
import { getTSLMap, mapTallyToTSL, updateTSLMapItem, sendAllTalliesOff } from "../actions";
import { useTRPC } from "../providers/trpc";
import TSLMapTable from "./TSLMapTable";
import MapTallyForm from "./MapTallyForm";
import SendAllOff from "./SendAllOff";

interface TallyDashboardProps {
  initialMap: TallyTSLMapWithActive;
}

function tallyTSLMapItemWithActiveToRequestBody(item: TallyTSLMapItemWithActive): Partial<TallyTSLMapItemNoId> {
  return {
    tallyId: item.tallyId,
    bus: item.bus,
    screen: item.screen,
    index: item.index,
    tallyType: item.tallyType,
    tallyColor: item.tallyColor,
    name: item.name,
  };
}

export default function TallyDashboard({ initialMap }: TallyDashboardProps) {
  const [tslMap, setTslMap] = useState<TallyTSLMapWithActive>(initialMap);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const editingItem: Partial<TallyTSLMapItemNoId> | null = editingItemId ? (() => {
    const item = Object.values(tslMap).flat().find((i) => i.id === editingItemId);
    return item ? tallyTSLMapItemWithActiveToRequestBody(item) : null;
  })() : null;

  const handleMapItemsActiveStateChange = (itemStates: TallyTSLMapActiveState) => {
    // console.log("Received map items active state change from server: ", itemStates);
    let anyStateChanged = false;
    const newMap: TallyTSLMapWithActive = Object.fromEntries(
      Object.entries(tslMap).map(([screen, items]) => [
        screen,
        items.map((item) => {
          const active = itemStates[item.id] ?? item.active;
          if (active !== item.active) {
            anyStateChanged = true;
            return { ...item, active };
          }
          return item;
        }),
      ] as [string, TallyTSLMapItemWithActive[]])
    );
    if (anyStateChanged) {
      setTslMap(newMap);
      // console.log("Updated TSL map with active states from server: ", newMap);
    }
  };

  const trpc = useTRPC();
  useSubscription(trpc.onMapItemsActiveChanged.subscriptionOptions(
    void 0,
    {
      onData: handleMapItemsActiveStateChange,
    }
  ));

  async function handleRefreshMap() {
    setLoading(true);
    try {
      const data = await getTSLMap();
      setTslMap(data);
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
      setStatus("Tally mapped");
      const updated = await getTSLMap();
      setTslMap(updated);
      return result;
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateMapItem(body: MapTallyRequestBody): Promise<void> {
    const id = editingItemId;
    if (!id) {
      setStatus("Error: No editing item");
      return;
    }
    if (!editingItem) {
      setStatus("Error: No editing item");
      return;
    }
    setLoading(true);
    try {
      const result = await updateTSLMapItem(id, body);
      setStatus("Tally mapping updated");
      setEditingItemId(null);
      setTslMap(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAllOff() {
    setLoading(true);
    try {
      await sendAllTalliesOff();
      setStatus("All tallies sent off");
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
      <TSLMapTable
        tslMap={tslMap}
        editingItemId={editingItemId || undefined}
        loading={loading}
        onRefresh={handleRefreshMap}
        onEditButtonClick={setEditingItemId}
      />
      {editingItemId ?
        <MapTallyForm
          titleText={`Editing Tally ${editingItemId}`}
          initialValues={editingItem ?? undefined}
          loading={loading}
          onSubmit={handleUpdateMapItem}
          onCancel={() => setEditingItemId(null)}
        /> :
        <MapTallyForm
          titleText="Map Tally to TSL"
          loading={loading}
          onSubmit={handleMapTally}
        />
      }
      <SendAllOff loading={loading} onSendAllOff={handleSendAllOff} />
    </div>
  );
}
