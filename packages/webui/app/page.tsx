import { getTSLMap } from "./actions";
import TallyDashboard from "./components/TallyDashboard";

export default async function Home() {
  let initialMap = {};
  try {
    initialMap = await getTSLMap();
  } catch {
    // API server may not be running yet; start with empty map
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-12 px-6 bg-white dark:bg-black">
        <h1 className="text-2xl font-bold">ATEM Tally</h1>
        <TallyDashboard initialMap={initialMap} />
      </main>
    </div>
  );
}
