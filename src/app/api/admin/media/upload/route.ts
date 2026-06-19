import { PutObjectCommand } from "@aws-sdk/client-s3"
import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "node:buffer"

import {
  buildCdnUrl,
  createMediaObjectKey,
  getR2Client,
  R2_BUCKET_NAME,
  sanitizeFileName,
} from "@/lib/r2"

export const runtime = "nodejs"

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const CACHE_CONTROL = "public, max-age=31536000, immutable"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be 10MB or smaller" }, { status: 400 })
    }

    const key = createMediaObjectKey(file.name)
    const body = Buffer.from(await file.arrayBuffer())

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
        CacheControl: CACHE_CONTROL,
        Metadata: {
          originalName: sanitizeFileName(file.name),
        },
      })
    )

    return NextResponse.json({
      url: buildCdnUrl(key),
      key,
      name: file.name,
      size: file.size,
      contentType: file.type,
    })
  } catch (error) {
    console.error("R2 upload failed:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
