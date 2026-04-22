import { debug as createDebug } from "debug";
import exitHook from "exit-hook";
import type { Server } from "node:http";
import { EnvConfigDefaults, ensureNumber } from "@atemtally/common";
import { AtemController } from "./atem";
import { TallyTSLMapper, TallyTSLBridge } from "./tally";
import { Config } from "./config";
import { createApp, startServer, stopServer } from "./trpcServer";
import { createWebSocketServer, stopWebSocketServer } from "./trpcWSServer";
export type { AppRouter, MapTallyRequestBody } from "./trpcRouter";


const debug = createDebug("atemtally:index");
createDebug.enable("atemtally:*");


interface AppContext {
  atemController: AtemController;
  tslBridge: TallyTSLBridge;
  apiServer: Server;
  wsServer: ReturnType<typeof createWebSocketServer>;
}

export interface ApiContext {
  tslMapper: TallyTSLMapper;
  tslBridge: TallyTSLBridge;
}

async function startup(): Promise<AppContext> {
  // const config = Config.fromJSON(process.env.CONFIG_JSON || "{}");
  const configFilename = process.env.ATEM_CONFIG_FILENAME || EnvConfigDefaults.ATEM_CONFIG_FILENAME;
  const config = Config.fromFile(configFilename);
  const atemController = new AtemController(config.atemAddress);
  const tslMapper = new TallyTSLMapper(config);
  const tslBridge = new TallyTSLBridge(tslMapper, config.tsl5Clients, config);
  atemController.on('tallyUpdated', (tallies) => {
    tslBridge.handleTallyUpdate(tallies).catch((error) => console.error(error));
  });
  atemController.on('tallyResend', (tallies) => {
    tslBridge.resendTallies(tallies).catch((error) => console.error(error));
  });
  await tslBridge.sendAllTalliesOff(); // Ensure all tallies are off on startup
  await atemController.connect();
  debug("Starting API server...");
  const app = createApp({ tslMapper, tslBridge });
  const apiServer = await startServer(app, ensureNumber(process.env.ATEM_API_PORT, EnvConfigDefaults.ATEM_API_PORT));
  const wsServer = createWebSocketServer();
  return { atemController, tslBridge, apiServer, wsServer };
}

async function shutdown(context: AppContext|null): Promise<void> {
  if (!context) {
    debug("No context provided to shutdown, exiting immediately");
    return;
  }
  debug("Sending all tallies off...");
  await context.tslBridge.sendAllTalliesOff();
  // Clean up resources, close connections, etc.
  debug("Shutting down application...");
  if (context.atemController.connected) {
    debug("Disconnecting from ATEM...");
    await context.atemController.disconnect();
  }
  await stopServer(context.apiServer);
  await stopWebSocketServer(context.wsServer);
  debug("Application shutdown complete");
}

let appContext: AppContext|null = null;

exitHook((signal) => {
  debug(`Exit signal received: ${signal}`);
  shutdown(appContext)
    .then(() => {
      debug("Shutdown complete, exiting now.");
    })
    .catch((error) => {
      debug("Error during shutdown:", error);
    });
});


startup()
  .then((context) => {
    appContext = context;
    debug("Application started successfully");
  })
  .catch((error) => {
    debug("Failed to start application:", error);
  });
