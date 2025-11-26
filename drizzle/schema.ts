import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here
/**
 * Trades table - stores all executed trades for history and analytics
 */
export const trades = mysqlTable('trades', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id),
  action: mysqlEnum('action', ['BUY', 'SELL', 'CLOSE']).notNull(),
  type: mysqlEnum('type', ['LONG', 'SHORT']).notNull(),
  entryPrice: int('entryPrice').notNull(), // Store as cents to avoid decimals
  exitPrice: int('exitPrice'), // Null until position closed
  size: int('size').notNull(), // Store as fixed-point (e.g., 0.5 ETH = 50000)
  pnl: int('pnl'), // Null until position closed, stored as cents
  fee: int('fee').notNull(), // Trading fee in cents
  reason: varchar('reason', { length: 64 }).notNull(), // MANUAL, QUANT_ENTRY, QUANT_EXIT, etc
  sharpeRatio: int('sharpeRatio'), // Sharpe ratio at time of trade (stored as fixed-point)
  volatility: int('volatility'), // ATR volatility at time of trade
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  closedAt: timestamp('closedAt'), // When position was closed
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Performance metrics table - daily/periodic snapshots for analytics
 */
export const performanceMetrics = mysqlTable('performanceMetrics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id),
  date: timestamp('date').notNull(), // Date of metrics snapshot
  totalTrades: int('totalTrades').notNull().default(0),
  winningTrades: int('winningTrades').notNull().default(0),
  losingTrades: int('losingTrades').notNull().default(0),
  totalPnl: int('totalPnl').notNull().default(0), // Total P&L in cents
  totalFees: int('totalFees').notNull().default(0), // Total fees in cents
  averageWin: int('averageWin'), // Average winning trade in cents
  averageLoss: int('averageLoss'), // Average losing trade in cents
  winRate: int('winRate'), // Win rate as percentage (0-100)
  sharpeRatio: int('sharpeRatio'), // Portfolio Sharpe ratio
  maxDrawdown: int('maxDrawdown'), // Maximum drawdown in cents
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
