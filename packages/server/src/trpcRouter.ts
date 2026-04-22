
import { debug as createDebug } from "debug";
import { on } from 'node:events';
import { router, publicProcedure } from './trpcContext';
import { z } from 'zod';

import {
  Tally,
  TallyBus,
  TallyMEId,
  TallyTSLMapItemWithActive,
  TSL5TallyType,
} from "@atemtally/common";

const debug = createDebug("atemtally:appRouter");


export interface MapTallyRequestBody extends Omit<Tally, "busses" | "name"> {
  bus: TallyBus;
  tallyType: TSL5TallyType;
  name?: string;
}

const zTallyBus = z.union([z.literal("program"), z.literal("preview")]);
const zTallyColor = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const zTallyType = z.union([
  z.literal("rh_tally"),
  z.literal("text_tally"),
  z.literal("lh_tally"),
]);


export const appRouter = router({
  getAllTallyMaps: publicProcedure.query(({ ctx }) => {
    const tslMap = ctx.tslMapper.getTSLMap();
    const mapObj: Record<TallyMEId, TallyTSLMapItemWithActive[]> = {};
    debug("Building TSL map response");
    for (const [key, value] of tslMap.entries()) {
      mapObj[key] = value.map((item) => ({
        ...item,
        active: ctx.tslMapper.getItemActive(item.id),
      }));
    }
    return mapObj;
  }),
  createTallyMap: publicProcedure
    .input(z.object({
      inputIndex: z.number(),
      mixEngineIndex: z.number(),
      tallyColor: zTallyColor,
      name: z.string().optional(),
      bus: zTallyBus,
      tallyType: zTallyType,
    }))
    .mutation(({ ctx, input }) => {
      const { inputIndex, mixEngineIndex, tallyColor, name, bus, tallyType } = input;
      const result = ctx.tslMapper.mapTallyToTSL(
        {
          inputIndex,
          mixEngineIndex,
          tallyColor,
          name: name ?? "",
        },
        bus,
        tallyType,
      );
      return result;
    }),
  getTallyMapById: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(({ ctx, input }) => {
      const { id } = input;
      const item = ctx.tslMapper.getById(id);
      if (!item) {
        throw new Error("Tally mapping not found");
      }
      return item;
    }),
  deleteTallyMapById: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      const { id } = input;
      const item = ctx.tslMapper.getById(id);
      if (!item) {
        throw new Error("Tally mapping not found");
      }
      ctx.tslMapper.unmapTallyFromTSL(id);
      return { ok: true };
     }),
  updateTallyMapItem: publicProcedure
    .input(z.object({
      id: z.string(),
      updatedFields: z.object({
        bus: zTallyBus.optional(),
        screen: z.number().optional(),
        index: z.number().optional(),
        tallyType: zTallyType.optional(),
        tallyColor: zTallyColor.optional(),
        name: z.string().optional(),
      }),
    }))
    .mutation(({ ctx, input }) => {
      const { id, updatedFields } = input;
      const item = ctx.tslMapper.getById(id);
      if (!item) {
        throw new Error("Tally mapping not found");
      }
      ctx.tslMapper.updateMapItem(id, updatedFields);
      const tslMap = ctx.tslMapper.getTSLMap();
      const mapObj: Record<TallyMEId, TallyTSLMapItemWithActive[]> = {};
      for (const [key, value] of tslMap.entries()) {
        mapObj[key] = value.map((item) => ({
          ...item,
          active: ctx.tslMapper.getItemActive(item.id),
        }));
      }
      return mapObj;
     }),
  sendAllOff: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.tslBridge.sendAllTalliesOff();
    return { ok: true };
  }),
  onMapItemsActiveChanged: publicProcedure.subscription(async function* (opts) {
    const { ctx } = opts;
    for await (const [activeState] of on(ctx.tslMapper, "mapItemsActiveChanged")) {
      if (opts.signal!.aborted) {
        break;
      }
      yield activeState;
    }
  }),
  ping: publicProcedure.query(() => {
    return "pong";
  }),



});

export type AppRouter = typeof appRouter;
