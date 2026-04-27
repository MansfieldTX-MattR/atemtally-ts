"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, wsLink, createWSClient } from '@trpc/client';
import { useState, createContext } from 'react';
import type { AppRouter } from '@atemtally/server';
import { TRPCProvider } from "./trpc";


function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}


interface ReactQueryContextType {
  trpcClient: ReturnType<typeof createTRPCClient<AppRouter>>;
}

export const ReactQueryContext = createContext<ReactQueryContextType | null>(null);

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

const WEBSOCKET_URI = process.env.NEXT_PUBLIC_WEBSOCKET_URI;

const getWebsocketUri = (): string => {
  if (WEBSOCKET_URI === undefined) {
    throw new Error("Missing required environment variable NEXT_PUBLIC_WEBSOCKET_URI");
  }
  return WEBSOCKET_URI;
};

getWebsocketUri(); // Validate at module load time so we fail fast if it's missing


export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() => createTRPCClient<AppRouter>({
    links: [
      wsLink<AppRouter>({
        client: createWSClient({
          url: getWebsocketUri(),
        }),
      }),
    ],
  }));
  return (
    <ReactQueryContext.Provider value={{ trpcClient }}>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      </QueryClientProvider>
    </ReactQueryContext.Provider>
  );
}
