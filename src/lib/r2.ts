import "server-only"

import { S3Client } from "@aws-sdk/client-s3"
import { randomUUID } from "node:crypto"

const DEFAULT_CDN_BASE_URL = "https://cdnoil.karthick.xyz"

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mithraoil"
export const CDN_BASE_URL = (
  process.env.NEXT_PUBLIC_CDN_BASE_URL || DEFAULT_CDN_BASE_URL
).replace(/\/$/, "")

let r2Client: S3Client | null = null

export function getR2Client() {
  if (r2Client) return r2Client

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 configuration. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    )
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return r2Client
}

export function buildCdnUrl(key: string) {
  const encodedPath = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")

  return `${CDN_BASE_URL}/${encodedPath}`
}

export function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")

  return sanitized || "image"
}

export function createMediaObjectKey(fileName: string) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const random = randomUUID().slice(0, 8)

  return `rajaoil/${year}/${month}/${Date.now()}_${random}_${sanitizeFileName(fileName)}`
}

export function resolveMediaObjectKey(input: { key?: unknown; url?: unknown }) {
  if (typeof input.key === "string" && input.key.trim()) {
    return normalizeObjectKey(input.key)
  }

  if (typeof input.url !== "string" || !input.url.trim()) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(input.url)
  } catch {
    return null
  }

  const cdnHost = new URL(CDN_BASE_URL).host
  if (parsed.host !== cdnHost) return null

  return normalizeObjectKey(decodeURIComponent(parsed.pathname.replace(/^\/+/, "")))
}

function normalizeObjectKey(key: string) {
  const normalized = key.replace(/^\/+/, "")

  if (!normalized.startsWith("rajaoil/")) return null
  if (normalized.includes("..")) return null

  return normalized
}
