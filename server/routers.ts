import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { saveTrade, getUserTrades, getTradesByDateRange, savePerformanceMetrics, getUserPerformanceMetrics, getLatestPerformanceMetrics } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  trading: router({
    saveTrade: protectedProcedure
      .input(z.object({
        action: z.enum(['BUY', 'SELL', 'CLOSE']),
        type: z.enum(['LONG', 'SHORT']),
        entryPrice: z.number(),
        exitPrice: z.number().optional(),
        size: z.number(),
        pnl: z.number().optional(),
        fee: z.number(),
        reason: z.string(),
        sharpeRatio: z.number().optional(),
        volatility: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveTrade(ctx.user.id, input as any);
        return { success: true };
      }),

    getTrades: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return await getUserTrades(ctx.user.id, input.limit);
      }),

    getTradesByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await getTradesByDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    saveMetrics: protectedProcedure
      .input(z.object({
        date: z.date(),
        totalTrades: z.number(),
        winningTrades: z.number(),
        losingTrades: z.number(),
        totalPnl: z.number(),
        totalFees: z.number(),
        averageWin: z.number().optional(),
        averageLoss: z.number().optional(),
        winRate: z.number(),
        sharpeRatio: z.number(),
        maxDrawdown: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await savePerformanceMetrics(ctx.user.id, input as any);
        return { success: true };
      }),

    getMetrics: protectedProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await getUserPerformanceMetrics(ctx.user.id, input.limit);
      }),

    getLatestMetrics: protectedProcedure
      .query(async ({ ctx }) => {
        return await getLatestPerformanceMetrics(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
