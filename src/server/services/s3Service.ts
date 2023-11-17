import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
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
  async deleteObject(key: string) {
    try {
      const res = await S3.send(
        new DeleteObjectCommand({
          Bucket: env.s3.bucketName,
          Key: key,
        })
      )

      return res.$metadata.httpStatusCode === 200
    } catch (error) {
      console.error(error)
      return false
    }
  },

  async getPresignedPutUrls(keys: string[]): Promise<string[] | void> {
    try {
      return Promise.all(
        keys.map((key) =>
          getSignedUrl(S3, new GetObjectCommand({ Bucket: env.s3.bucketName, Key: key }), {
            expiresIn: 3600,
          })
        )
      )
    } catch (error) {
      console.error(error)
      return
    }
  },
  async getPresignedPutUrl(key: string): Promise<string | void> {
    try {
      return getSignedUrl(S3, new PutObjectCommand({ Bucket: env.s3.bucketName, Key: key }), {
        expiresIn: 3600,
      })
    } catch (error) {
      console.error(error)
      return
    }
  },
  async getPresignedGetUrl(key: string) {
    try {
      return getSignedUrl(S3, new GetObjectCommand({ Bucket: env.s3.bucketName, Key: key }), {
        expiresIn: 3600,
      })
    } catch (error) {
      console.error(error)
      return
    }
  },
}
