import { Suspense } from "react";
import { getTSLMap } from "./actions";
import ReactQueryProvider from "./providers/ReactQueryProvider";
import TallyDashboard from "./components/TallyDashboard";
import type { TallyTSLRecordsWithActive } from "@atemtally/common";
import { WEBSOCKET_URI } from "@/lib/confVars";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialMap: TallyTSLRecordsWithActive = {};
  try {
    initialMap = await getTSLMap();
  } catch {
    // API server may not be running yet; start with empty map
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-12 px-6 bg-white dark:bg-black">
        <h1 className="text-2xl font-bold">ATEM Tally</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <ReactQueryProvider websocketUri={WEBSOCKET_URI}>
            <TallyDashboard initialMap={initialMap} />
          </ReactQueryProvider>
        </Suspense>
      </main>
    </div>
  );
}
