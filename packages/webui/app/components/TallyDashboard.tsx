"use client";

import { useState } from "react";
import type {
  GetTSLMapResponse,
  MapTallyRequestBody,
  TallyTSLMapItem,
} from "@atemtally/common";
import { getTSLMap, mapTallyToTSL, sendAllTalliesOff } from "../actions";
import TSLMapTable from "./TSLMapTable";
import MapTallyForm from "./MapTallyForm";
import SendAllOff from "./SendAllOff";

interface TallyDashboardProps {
  initialMap: GetTSLMapResponse;
}

export default function TallyDashboard({ initialMap }: TallyDashboardProps) {
  const [tslMap, setTslMap] = useState<GetTSLMapResponse>(initialMap);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRefreshMap() {
    setLoading(true);
    try {
      const data = await getTSLMap();
      setTslMap(data);
      setStatus("Map refreshed");
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
      setTslMap(updated);
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
