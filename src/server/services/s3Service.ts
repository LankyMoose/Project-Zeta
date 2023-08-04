import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { env } from "../../env"

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
})

export const s3Service = {
  async getPresignedPutUrl(key: string) {
    return getSignedUrl(S3, new PutObjectCommand({ Bucket: env.s3.bucketName, Key: key }), {
      expiresIn: 3600,
    })
  },
  async getPresignedGetUrl(key: string) {
    return getSignedUrl(S3, new GetObjectCommand({ Bucket: env.s3.bucketName, Key: key }), {
      expiresIn: 3600,
    })
  },
}
