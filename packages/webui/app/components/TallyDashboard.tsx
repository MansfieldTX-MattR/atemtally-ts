"use client";

import { useState } from "react";
import type {
  GetTSLMapResponse,
  MapTallyRequestBody,
  TallyTSLMapItem,
  TallyBus,
  TSL5TallyType,
} from "@atemtally/common";
import { TallyColor } from "@atemtally/common";
import { getTSLMap, mapTallyToTSL, sendAllTalliesOff } from "../actions";

interface TallyDashboardProps {
  initialMap: GetTSLMapResponse;
}

export default function TallyDashboard({ initialMap }: TallyDashboardProps) {
  const [tslMap, setTslMap] = useState<GetTSLMapResponse>(initialMap);
  const [mapResult, setMapResult] = useState<TallyTSLMapItem | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state for mapTallyToTSL
  const [inputIndex, setInputIndex] = useState(1);
  const [mixEngineIndex, setMixEngineIndex] = useState(0);
  const [color, setColor] = useState<TallyColor>(TallyColor.RED);
  const [bus, setBus] = useState<TallyBus>("program");
  const [tallyType, setTallyType] = useState<TSL5TallyType>("rh_tally");
  const [name, setName] = useState("");

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

  async function handleMapTally(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMapResult(null);
    try {
      const body: MapTallyRequestBody = {
        inputIndex,
        mixEngineIndex,
        color,
        bus,
        tallyType,
        name: name || undefined,
      };
      const result = await mapTallyToTSL(body);
      if ("error" in result) {
        setStatus(`Error: ${result.error}`);
      } else {
        setMapResult(result);
        setStatus("Tally mapped");
      }
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
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

  const tallyColorLabel = (c: TallyColor) => {
    switch (c) {
      case TallyColor.OFF: return "Off";
      case TallyColor.RED: return "Red";
      case TallyColor.GREEN: return "Green";
      case TallyColor.AMBER: return "Amber";
      default: return String(c);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Status bar */}
      {status && (
        <div className="rounded bg-zinc-100 px-4 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {status}
        </div>
      )}

      {/* TSL Map */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">TSL Map</h2>
          <button
            onClick={handleRefreshMap}
            disabled={loading}
            className="rounded bg-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            Refresh
          </button>
        </div>
        {Object.keys(tslMap).length === 0 ? (
          <p className="text-zinc-500">No mappings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                  <th className="py-2 pr-4">Tally ID</th>
                  <th className="py-2 pr-4">Bus</th>
                  <th className="py-2 pr-4">Screen</th>
                  <th className="py-2 pr-4">Index</th>
                  <th className="py-2 pr-4">Tally Type</th>
                  <th className="py-2">Color</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tslMap).flatMap(([tallyId, items]) =>
                  items.map((item, i) => (
                    <tr key={`${tallyId}-${i}`} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-2 pr-4 font-mono">{item.tallyId}</td>
                      <td className="py-2 pr-4">{item.bus}</td>
                      <td className="py-2 pr-4">{item.screen}</td>
                      <td className="py-2 pr-4">{item.index}</td>
                      <td className="py-2 pr-4">{item.tallyType}</td>
                      <td className="py-2">{tallyColorLabel(item.tallyColor)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Map Tally Form */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Map Tally to TSL</h2>
        <form onSubmit={handleMapTally} className="grid grid-cols-2 gap-4 max-w-lg">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Input Index</span>
            <input
              type="number"
              value={inputIndex}
              onChange={(e) => setInputIndex(Number(e.target.value))}
              className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Mix Engine Index</span>
            <input
              type="number"
              value={mixEngineIndex}
              onChange={(e) => setMixEngineIndex(Number(e.target.value))}
              className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Color</span>
            <select
              value={color}
              onChange={(e) => setColor(Number(e.target.value) as TallyColor)}
              className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value={TallyColor.OFF}>Off</option>
              <option value={TallyColor.RED}>Red</option>
              <option value={TallyColor.GREEN}>Green</option>
              <option value={TallyColor.AMBER}>Amber</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Bus</span>
            <select
              value={bus}
              onChange={(e) => setBus(e.target.value as TallyBus)}
              className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="program">Program</option>
              <option value="preview">Preview</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Tally Type</span>
            <select
              value={tallyType}
              onChange={(e) => setTallyType(e.target.value as TSL5TallyType)}
              className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="rh_tally">RH Tally</option>
              <option value="lh_tally">LH Tally</option>
              <option value="text_tally">Text Tally</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name (optional)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </label>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Map Tally
            </button>
          </div>
        </form>
        {mapResult && (
          <pre className="mt-4 rounded bg-zinc-100 p-4 text-sm overflow-x-auto dark:bg-zinc-800">
            {JSON.stringify(mapResult, null, 2)}
          </pre>
        )}
      </section>

      {/* Send All Off */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Send All Tallies Off</h2>
        <button
          onClick={handleSendAllOff}
          disabled={loading}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Send All Off
        </button>
      </section>
    </div>
  );
}
