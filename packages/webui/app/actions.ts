"use server";

import type { TallyTSLMapItemNoId } from "@atemtally/common";
import type { MapTallyRequestBody } from "@atemtally/server";
import { WEBSOCKET_URI } from "@/lib/confVars";

import { trpcClient } from "./trpc";


export async function getTSLMap() {
  return await trpcClient.getAllTallyMaps.query();
}

export async function getTSLMapItem(id: string) {
  return await trpcClient.getTallyMapById.query({ id });
}

export async function mapTallyToTSL(body: MapTallyRequestBody) {
  return await trpcClient.createTallyMap.mutate(body);
}

export async function updateTSLMapItem(id: string, body: Partial<TallyTSLMapItemNoId>) {
  return await trpcClient.updateTallyMapItem.mutate({ id, updatedFields: body });
}

export async function unmapTallyFromTSL(id: string) {
  return await trpcClient.deleteTallyMapById.mutate({ id });
}

export async function sendAllTalliesOff() {
  return await trpcClient.sendAllOff.mutate();
}


export async function getWebsocketUri(): Promise<{ websocketUri: string }> { // eslint-disable-line @typescript-eslint/require-await
  return { websocketUri: WEBSOCKET_URI };
}
