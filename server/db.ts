import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { log } from "./vite";

// Create a PostgreSQL connection pool with reconnection settings
export const pool = new Pool({
  user: 'postgres',
  password: 'Sini123',
  host: 'localhost',
  port: 5432,
  database: 'dubai_jazz_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // retryDelay: 1000,
  ssl: false
});

pool.on('error', (err: NodeJS.ErrnoException) => {
  log(`Database pool error: ${err}`, "drizzle");
  // Handle pool errors and attempt reconnection
  if (err.code === '57P01') {
    log("Attempting to reconnect to database...", "drizzle");
    pool.connect();
  }
});

// Test the database connection
pool.connect()
  .then(() => log("Database connection successful", "drizzle"))
  .catch((err) => log(`Database connection error: ${err}`, "drizzle"));

// Create a Drizzle instance
export const db = drizzle(pool);