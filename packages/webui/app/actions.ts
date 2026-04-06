"use server";

import type {
  MapTallyRequestBody,
  MapTallyResponse,
  GetTSLMapResponse,
  SendAllOffResponse,
  ErrorResponse,
} from "@atemtally/common";
import { EnvConfigDefaults } from "@atemtally/common";

const API_BASE = process.env.ATEM_API_BASE_URL ?? EnvConfigDefaults.ATEM_API_BASE_URL;


export async function getTSLMap(): Promise<GetTSLMapResponse> {
  const res = await fetch(`${API_BASE}/api/tally/map`, { cache: "no-store" });
  if (!res.ok) {
    const err: ErrorResponse = await res.json();
    throw new Error(err.error ?? "Failed to fetch TSL map");
  }
  return res.json();
}

export async function mapTallyToTSL(
  body: MapTallyRequestBody
): Promise<MapTallyResponse | ErrorResponse> {
  const res = await fetch(`${API_BASE}/api/tally/map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendAllTalliesOff(): Promise<SendAllOffResponse | ErrorResponse> {
  const res = await fetch(`${API_BASE}/api/tally/off`, {
    method: "POST",
  });
  return res.json();
}
