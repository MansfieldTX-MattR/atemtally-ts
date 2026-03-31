"use client";

import { useState } from "react";
import type {
  MapTallyRequestBody,
  TallyTSLMapItem,
  TallyBus,
  TSL5TallyType,
} from "@atemtally/common";
import { TallyColor } from "@atemtally/common";

interface MapTallyFormProps {
  loading: boolean;
  onSubmit: (body: MapTallyRequestBody) => Promise<TallyTSLMapItem | null>;
}

export default function MapTallyForm({ loading, onSubmit }: MapTallyFormProps) {
  const [inputIndex, setInputIndex] = useState(1);
  const [mixEngineIndex, setMixEngineIndex] = useState(0);
  const [color, setColor] = useState<TallyColor>(TallyColor.RED);
  const [bus, setBus] = useState<TallyBus>("program");
  const [tallyType, setTallyType] = useState<TSL5TallyType>("rh_tally");
  const [name, setName] = useState("");
  const [mapResult, setMapResult] = useState<TallyTSLMapItem | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMapResult(null);
    const body: MapTallyRequestBody = {
      inputIndex,
      mixEngineIndex,
      color,
      bus,
      tallyType,
      name: name || undefined,
    };
    const result = await onSubmit(body);
    setMapResult(result);
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Map Tally to TSL</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-w-lg">
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
  );
}
