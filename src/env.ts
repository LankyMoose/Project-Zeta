import dotenv from "dotenv"
dotenv.config()

export const env = {
  db: {
    host: process.env.DB_HOST as string,
    name: process.env.DB_NAME as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
  },
  port: process.env.PORT || "3000",
  url: process.env.URL || "http://localhost:3000",
  domain: process.env.DOMAIN || "localhost",
  auth0: {
    google: {
      clientId: process.env.GOOGLE_AUTH0_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_AUTH0_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_AUTH0_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_AUTH0_CLIENT_SECRET as string,
    },
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    bucketName: process.env.S3_BUCKET_NAME as string,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID as string,
  },
}

// recursively ensure that all keys in the object are defined
function ensureKeys<T>(obj: T): T {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      ensureKeys(obj[key])
    } else if (obj[key] === undefined) {
      throw new Error(`Missing environment variable: ${key}`)
    }
  }
  return obj
}

ensureKeys(env)
