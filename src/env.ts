import dotenv from "dotenv"
dotenv.config()

type ValidatedObj<T> = {
  [P in keyof T]: T[P] extends string | undefined ? string : ValidatedObj<T[P]>
}

// recursively ensure that all keys in the object are defined
function validate<T>(obj: T) {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      validate(obj[key])
    } else if (obj[key] === undefined) {
      throw new Error(`Missing environment variable: ${key}`)
    }
  }
  return obj as ValidatedObj<T>
}

export const env = validate({
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
    google: {
      id: process.env.GOOGLE_AUTH0_CLIENT_ID,
      secret: process.env.GOOGLE_AUTH0_CLIENT_SECRET,
    },
    github: {
      id: process.env.GITHUB_AUTH0_CLIENT_ID,
      secret: process.env.GITHUB_AUTH0_CLIENT_SECRET,
    },
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
  },
})
