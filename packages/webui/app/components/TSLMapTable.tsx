"use client";

import type { GetTSLMapResponse } from "@atemtally/common";
import { TallyColor } from "@atemtally/common";

interface TSLMapTableProps {
  tslMap: GetTSLMapResponse;
  loading: boolean;
  onRefresh: () => void;
}

function tallyColorLabel(c: TallyColor) {
  switch (c) {
    case TallyColor.OFF: return "Off";
    case TallyColor.RED: return "Red";
    case TallyColor.GREEN: return "Green";
    case TallyColor.AMBER: return "Amber";
    default: return String(c);
  }
}

export default function TSLMapTable({ tslMap, loading, onRefresh }: TSLMapTableProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">TSL Map</h2>
        <button
          onClick={onRefresh}
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
  );
}
