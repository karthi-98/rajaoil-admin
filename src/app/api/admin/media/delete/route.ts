import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { NextRequest, NextResponse } from "next/server"

import { getR2Client, R2_BUCKET_NAME, resolveMediaObjectKey } from "@/lib/r2"

export const runtime = "nodejs"

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const key = resolveMediaObjectKey({
      key: body?.key,
      url: body?.url,
    })

    if (!key) {
      return NextResponse.json(
        { error: "A valid cdnoil.karthick.xyz media URL or R2 key is required" },
        { status: 400 }
      )
    }

    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    )

    return NextResponse.json({ success: true, key })
  } catch (error) {
    console.error("R2 delete failed:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
