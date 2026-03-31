
import exitHook from "exit-hook";
import type { Server } from "node:http";
import { AtemController } from "./atem";
import { TallyTSLMapper, TallyTSLBridge } from "./tally";
import { Config } from "./config";
import { createApp, startServer, stopServer } from "./api";

interface AppContext {
  atemController: AtemController;
  tslBridge: TallyTSLBridge;
  apiServer: Server;
}

async function startup(): Promise<AppContext> {
  // const config = Config.fromJSON(process.env.CONFIG_JSON || "{}");
  const configFilename = "../../conf.json";
  const config = Config.fromFile(configFilename);
  const atemController = new AtemController(config.atemAddress);
  const tslMapper = new TallyTSLMapper();
  tslMapper.loadTSLMap(config.tallyMap);
  // console.log("Loaded TSL map:", tslMapper.getTSLMap());
  const tslBridge = new TallyTSLBridge(tslMapper, config.tsl5Clients);
  atemController.on('tallyUpdated', (tallies) => {
    tslBridge.handleTallyUpdate(tallies);
  });
  tslBridge.sendAllTalliesOff(); // Ensure all tallies are off on startup
  await atemController.connect();
  const app = createApp({ tslMapper, tslBridge });
  const apiServer = await startServer(app, 3000);
  return { atemController, tslBridge, apiServer };
}

async function shutdown(context: AppContext|null): Promise<void> {
  if (!context) {
    console.warn("No context provided to shutdown, exiting immediately");
    return;
  }
  console.log("Sending all tallies off...");
  context.tslBridge.sendAllTalliesOff();
  // Clean up resources, close connections, etc.
  console.log("Shutting down application...");
  await stopServer(context.apiServer);
  await context.atemController.disconnect();
  console.log("Application shutdown complete");
}

let appContext: AppContext|null = null;

exitHook((signal) => {
  console.log(`Exit signal received: ${signal}`);
  shutdown(appContext)
    .then(() => {
      console.log("Shutdown complete, exiting now.");
    })
    .catch((error) => {
      console.error("Error during shutdown:", error);
    });
});


startup()
  .then((context) => {
    appContext = context;
    console.log("Application started successfully");
  })
  .catch((error) => {
    console.error("Failed to start application:", error);
  });
