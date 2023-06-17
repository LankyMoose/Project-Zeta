import postgres from "postgres"
import { env } from "../env.js"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

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

export const db = drizzle(poolConnection, { schema })
