import { Suspense } from "react";
import { getTSLMap } from "./actions";
import SocketProvider from "./providers/SocketProvider";
import TallyDashboard from "./components/TallyDashboard";
import { getWebsocketUri } from "./actions";
import type { GetTSLMapResponse } from "@atemtally/common";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialMap: GetTSLMapResponse = {};
  try {
    initialMap = await getTSLMap();
  } catch {
    // API server may not be running yet; start with empty map
  }

  const websocketUri = await getWebsocketUri();

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-12 px-6 bg-white dark:bg-black">
        <h1 className="text-2xl font-bold">ATEM Tally</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <SocketProvider socketUri={websocketUri.websocketUri}>
            <TallyDashboard initialMap={initialMap} />
          </SocketProvider>
        </Suspense>
      </main>
    </div>
  );
}
