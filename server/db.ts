import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Detect common misconfiguration: value copied with surrounding quotes from .env file
if (dbUrl.startsWith('"') || dbUrl.startsWith("'")) {
  throw new Error(
    `DATABASE_URL must not be wrapped in quotes. ` +
    `Remove the surrounding quotes in your Vercel environment variable settings. ` +
    `Got: ${dbUrl.slice(0, 30)}...`
  );
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });

/**
 * Run lightweight schema migrations for tables added after initial db:push.
 * Each statement is idempotent (IF NOT EXISTS / IF NOT).
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // board_resources table (added in step 5)
    await client.query(`
      CREATE TABLE IF NOT EXISTS board_resources (
        id          SERIAL PRIMARY KEY,
        title       TEXT NOT NULL,
        url         TEXT NOT NULL,
        description TEXT,
        category    TEXT NOT NULL DEFAULT 'other',
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // matches: allow 'awaiting_admin' status (step 4 – text column, no constraint needed)
  } finally {
    client.release();
  }
}
