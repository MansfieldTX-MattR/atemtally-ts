
import exitHook from "exit-hook";
import { AtemController } from "./atem";
import { TallyTSLMapper, TallyTSLBridge } from "./tally";
import { Config } from "./config";

interface AppContext {
  atemController: AtemController;
  tslBridge: TallyTSLBridge;
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
  return { atemController, tslBridge };
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

process.on('SIGINT', () => {
  new Promise<void>((resolve) => {
    console.log("SIGINT received, shutting down...");
    shutdown(appContext).then(resolve);
  }).then(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  new Promise<void>((resolve) => {
    console.log("SIGTERM received, shutting down...");
    shutdown(appContext).then(resolve);
  }).then(() => {
    process.exit(0);
  });
});
