import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import * as schema from "../shared/schema";

// import { log } from "./vite";

dotenv.config();

// Create a PostgreSQL connection pool with reconnection settings
export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? "",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 300000,
  // retryDelay: 1000,
  ssl: false
});

pool.on('error', (err: NodeJS.ErrnoException) => {
  console.log(`Database pool error: ${err}`, "drizzle");
  // Handle pool errors and attempt reconnection
  if (err.code === '57P01') {
    console.log("Attempting to reconnect to database...", "drizzle");
    pool.connect();
  }
});

// Test the database connection
pool.connect()
  .then(() => console.log("Database connection successful", "drizzle"))
  .catch((err) => console.log(`Database connection error: ${err}`, "drizzle"));

// Create a Drizzle instance
export const db = drizzle(pool, { schema });