
// const NEXTJS_TSL_HOST = process.env.NEXTJS_TSL_HOST || "localhost";
// const NEXTJS_TSL_PORT = process.env.NEXTJS_TSL_PORT ? Number(process.env.NEXTJS_TSL_PORT) : 62000;
// const ATEM_CONFIG_FILENAME = process.env.ATEM_CONFIG_FILENAME || "../../conf.json";
// const ATEM_API_BASE_URL = process.env.ATEM_API_BASE_URL || "http://localhost:3000";


// export namespace Common.Env {

export interface EnvConfig {
  NEXTJS_TSL_HOST: string;
  NEXTJS_TSL_PORT: number;
  ATEM_CONFIG_FILENAME: string;
  ATEM_API_BASE_URL: string;
}

export const EnvConfigTypes = {
  NEXTJS_TSL_HOST: "string",
  NEXTJS_TSL_PORT: "number",
  ATEM_CONFIG_FILENAME: "string",
  ATEM_API_BASE_URL: "string",
} as const;

export const EnvConfigDefaults: EnvConfig = {
  NEXTJS_TSL_HOST: "localhost",
  NEXTJS_TSL_PORT: 62002,
  ATEM_CONFIG_FILENAME: "../../conf.json",
  ATEM_API_BASE_URL: "http://localhost:3000",
};

// export function getEnvConfigVar<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
//   const envVar = process.env[key];
//   if (envVar === undefined) {
//     return EnvConfigDefaults[key];
//   }
//   const expectedType = EnvConfigTypes[key];
//   switch (expectedType) {
//     case "string":
//       return envVar as EnvConfig[K];
//     case "number":
//       const num = Number(envVar);
//       if (isNaN(num)) {
//         throw new Error(`Environment variable ${key} should be a number, but got: ${envVar}`);
//       }
//       return num as EnvConfig[K];
//     default:
//       throw new Error(`Unsupported environment variable type for key ${key}`);
//   }
// }

// export function getEnvConfig(): EnvConfig {
//   const nextJsTslHost = getEnvConfigVar("NEXTJS_TSL_HOST");
//   const nextJsTslPort = getEnvConfigVar("NEXTJS_TSL_PORT");
//   const atemConfigFilename = getEnvConfigVar("ATEM_CONFIG_FILENAME");
//   const atemApiBaseUrl = getEnvConfigVar("ATEM_API_BASE_URL");
//   return {
//     NEXTJS_TSL_HOST: nextJsTslHost,
//     NEXTJS_TSL_PORT: nextJsTslPort,
//     ATEM_CONFIG_FILENAME: atemConfigFilename,
//     ATEM_API_BASE_URL: atemApiBaseUrl,
//   };
//   // const keys: (keyof EnvConfig)[] = Object.keys(envConfigTypes) as (keyof EnvConfig)[];
//   // const config = {} as Partial<EnvConfig>;
//   // const confMap: Map<keyof EnvConfig, EnvConfig[keyof EnvConfig]> = new Map();
//   // for (const key of keys) {
//   //   // config[key] = getEnvConfigVar(key);
//   //   const val = getEnvConfigVar(key);
//   //   // config[key] = val;
//   //   confMap.set(key, val);
//   // }
//   // return Object.fromEntries(confMap) as EnvConfig;

// }
