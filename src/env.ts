import dotenv from "dotenv"
dotenv.config()

export const env = {
  db: {
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  port: process.env.PORT || "3000",
  url: process.env.URL || "http://localhost:3000",
  domain: process.env.DOMAIN || "localhost",
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
  },
}
