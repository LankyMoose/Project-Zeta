import dotenv from "dotenv"
dotenv.config()

export const env = {
  db: {
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  port: process.env.PORT || 3000,
}
