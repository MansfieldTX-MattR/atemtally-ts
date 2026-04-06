"use server";
import axios from "axios";

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
  const res = await axios.get<GetTSLMapResponse>(`${API_BASE}/api/tally/map`, {
    headers: {
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
  return res.data;
}

export async function mapTallyToTSL(
  body: MapTallyRequestBody
): Promise<MapTallyResponse | ErrorResponse> {
  const res = await axios.post<MapTallyResponse>(`${API_BASE}/api/tally/map`, body);
  return res.data;
}

export async function sendAllTalliesOff(): Promise<SendAllOffResponse | ErrorResponse> {
  const res = await axios.post<SendAllOffResponse>(`${API_BASE}/api/tally/off`);
  return res.data;
}
