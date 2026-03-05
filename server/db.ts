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
