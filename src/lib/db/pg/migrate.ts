import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "path";
import { pgdb } from "./db";

export const runMigrate = async () => {
  console.log("Running postgress migrations...");

  // * Start state
  const start = Date.now();

  // * migrate functionality with registering path folder to save migrations file
  await migrate(pgdb, {
    migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
  }).catch((err) => {
    console.error(`Postgress migrations failed`);
    throw err;
  });

  // * end state
  const end = Date.now();

  console.log(`Postgress migrations completed in ${end - start} ms`);
  
};
