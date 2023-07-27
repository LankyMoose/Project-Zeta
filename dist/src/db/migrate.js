import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index.js";
// this will automatically run needed migrations on the database
await migrate(db, { migrationsFolder: "./drizzle" });
