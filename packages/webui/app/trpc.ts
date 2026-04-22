"use server";
import { createTRPCClient, httpBatchLink } from '@trpc/client';

import type { AppRouter } from '@atemtally/server';

import { API_BASE_URL as API_BASE } from "@/lib/confVars";



export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE}`,
    }),
  ],
});
