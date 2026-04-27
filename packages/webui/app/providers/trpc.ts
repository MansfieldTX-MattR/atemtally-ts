import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@atemtally/server';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
