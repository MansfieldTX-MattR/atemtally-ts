"use server";
import axios from "axios";

import type {
  MapTallyRequestBody,
  MapTallyResponse,
  UnmapTallyResponse,
  GetTSLMapResponse,
  UpdateTSLMapItemRequestBody,
  SendAllOffResponse,
  ErrorResponse,
} from "@atemtally/common";
import { API_BASE_URL as API_BASE, WEBSOCKET_URI } from "@/lib/confVars";



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

export async function updateTSLMapItem(id: string, body: UpdateTSLMapItemRequestBody): Promise<GetTSLMapResponse | ErrorResponse> {
  const res = await axios.patch<GetTSLMapResponse>(`${API_BASE}/api/tally/map/${id}`, body);
  return res.data;
}

export async function unmapTallyFromTSL(id: string): Promise<UnmapTallyResponse | ErrorResponse> {
  const res = await axios.delete<UnmapTallyResponse>(`${API_BASE}/api/tally/map/${id}`);
  return res.data;
}

export async function sendAllTalliesOff(): Promise<SendAllOffResponse | ErrorResponse> {
  const res = await axios.post<SendAllOffResponse>(`${API_BASE}/api/tally/off`);
  return res.data;
}


export async function getWebsocketUri(): Promise<{ websocketUri: string }> { // eslint-disable-line @typescript-eslint/require-await
  return { websocketUri: WEBSOCKET_URI };
}
