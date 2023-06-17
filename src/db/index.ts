import postgres from "postgres"
import { env } from "../env.js"
import { drizzle } from "drizzle-orm/postgres-js"
import { dbSchema } from "./schema.js"
// create the connection
const poolConnection = postgres({
  host: env.db.host,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  ssl: {
    rejectUnauthorized: false,
  },
})

export const db = drizzle<typeof dbSchema>(poolConnection)
