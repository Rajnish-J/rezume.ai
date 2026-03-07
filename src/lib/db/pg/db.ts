import { Pool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import "dotenv/config";

// * registering database url in Pool object in drizzle ORM
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// * export pg instance
export const pgdb = drizzlePg(pool);
