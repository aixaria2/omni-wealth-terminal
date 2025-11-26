import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, trades, performanceMetrics, InsertTrade, InsertPerformanceMetric } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Trade queries
export async function saveTrade(userId: number, trade: InsertTrade): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot save trade: database not available');
    return;
  }

  try {
    await db.insert(trades).values({
      ...trade,
      userId
    });
  } catch (error) {
    console.error('[Database] Failed to save trade:', error);
    throw error;
  }
}

export async function getUserTrades(userId: number, limit: number = 100): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get trades: database not available');
    return [];
  }

  try {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('[Database] Failed to get trades:', error);
    return [];
  }
}

export async function getTradesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get trades: database not available');
    return [];
  }

  try {
    return await db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          gte(trades.createdAt, startDate),
          lte(trades.createdAt, endDate)
        )
      )
      .orderBy(desc(trades.createdAt));
  } catch (error) {
    console.error('[Database] Failed to get trades by date range:', error);
    return [];
  }
}

// Performance metrics queries
export async function savePerformanceMetrics(userId: number, metrics: InsertPerformanceMetric): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot save metrics: database not available');
    return;
  }

  try {
    await db.insert(performanceMetrics).values({
      ...metrics,
      userId
    });
  } catch (error) {
    console.error('[Database] Failed to save metrics:', error);
    throw error;
  }
}

export async function getUserPerformanceMetrics(userId: number, limit: number = 30): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get metrics: database not available');
    return [];
  }

  try {
    return await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, userId))
      .orderBy(desc(performanceMetrics.date))
      .limit(limit);
  } catch (error) {
    console.error('[Database] Failed to get metrics:', error);
    return [];
  }
}

export async function getLatestPerformanceMetrics(userId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get metrics: database not available');
    return null;
  }

  try {
    const result = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, userId))
      .orderBy(desc(performanceMetrics.date))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Failed to get latest metrics:', error);
    return null;
  }
}
