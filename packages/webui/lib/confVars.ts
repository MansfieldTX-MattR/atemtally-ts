import { EnvConfigDefaults } from "@atemtally/common";


export const WEBSOCKET_URI = process.env.NEXT_PUBLIC_WEBSOCKET_URI || EnvConfigDefaults.NEXTJS_PUBLIC_WEBSOCKET_URI;
export const API_BASE_URL = process.env.ATEM_API_BASE_URL ?? EnvConfigDefaults.ATEM_API_BASE_URL;
