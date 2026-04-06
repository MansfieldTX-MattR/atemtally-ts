import { debug as createDebug } from "debug";
import exitHook from "exit-hook";
import type { Server } from "node:http";
import { EnvConfigDefaults } from "@atemtally/common";
import { AtemController } from "./atem";
import { TallyTSLMapper, TallyTSLBridge } from "./tally";
import { Config } from "./config";
import { createApp, startServer, stopServer } from "./api";

const debug = createDebug("atemtally:index");
createDebug.enable("atemtally:*");

const NEXTJS_TSL_HOST = process.env.NEXTJS_TSL_HOST || EnvConfigDefaults.NEXTJS_TSL_HOST;
const NEXTJS_TSL_PORT = process.env.NEXTJS_TSL_PORT ? Number(process.env.NEXTJS_TSL_PORT) : EnvConfigDefaults.NEXTJS_TSL_PORT;

interface AppContext {
  atemController: AtemController;
  tslBridge: TallyTSLBridge;
  apiServer: Server;
}

async function startup(): Promise<AppContext> {
  // const config = Config.fromJSON(process.env.CONFIG_JSON || "{}");
  const configFilename = process.env.ATEM_CONFIG_FILENAME || EnvConfigDefaults.ATEM_CONFIG_FILENAME;
  const config = Config.fromFile(configFilename);
  const atemController = new AtemController(config.atemAddress);
  const tslMapper = new TallyTSLMapper(config);
  const tslBridge = new TallyTSLBridge(tslMapper, config.tsl5Clients, config);
  tslBridge.addClient({ host: NEXTJS_TSL_HOST, port: NEXTJS_TSL_PORT });
  atemController.on('tallyUpdated', (tallies) => {
    tslBridge.handleTallyUpdate(tallies);
  });
  atemController.on('tallyResend', (tallies) => {
    tslBridge.resendTallies(tallies);
  });
  tslBridge.sendAllTalliesOff(); // Ensure all tallies are off on startup
  await atemController.connect();
  debug("Starting API server...");
  const app = createApp({ tslMapper, tslBridge });
  const apiServer = await startServer(app, 3000);
  return { atemController, tslBridge, apiServer };
}

async function shutdown(context: AppContext|null): Promise<void> {
  if (!context) {
    debug("No context provided to shutdown, exiting immediately");
    return;
  }
  debug("Sending all tallies off...");
  context.tslBridge.sendAllTalliesOff();
  // Clean up resources, close connections, etc.
  debug("Shutting down application...");
  await stopServer(context.apiServer);
  if (context.atemController.connected) {
    debug("Disconnecting from ATEM...");
    await context.atemController.disconnect();
  }
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
