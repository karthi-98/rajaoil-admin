export interface MediaUploadResult {
  url: string
  key: string
  name: string
  size: number
  contentType: string
}

const CDN_BASE_URL = (
  process.env.NEXT_PUBLIC_CDN_BASE_URL || "https://cdnoil.karthick.xyz"
).replace(/\/$/, "")

export class MediaService {
  static uploadImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)

      const request = new XMLHttpRequest()

      request.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return
        onProgress((event.loaded / event.total) * 100)
      }

      request.onload = () => {
        let payload: unknown

        try {
          payload = JSON.parse(request.responseText)
        } catch {
          payload = null
        }

        if (request.status >= 200 && request.status < 300) {
          resolve(payload as MediaUploadResult)
          return
        }

        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Failed to upload image"
        reject(new Error(message))
      }

      request.onerror = () => reject(new Error("Failed to upload image"))
      request.open("POST", "/api/admin/media/upload")
      request.send(formData)
    })
  }

  static async deleteImage(url: string) {
    const response = await fetch("/api/admin/media/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "Failed to delete image"
      throw new Error(message)
    }
  }

  static isCdnUrl(url: string) {
    try {
      return new URL(url).origin === CDN_BASE_URL
    } catch {
      return false
    }
  }

  static getFileNameFromUrl(url: string) {
    try {
      const path = decodeURIComponent(new URL(url).pathname)
      const filename = path.split("/").filter(Boolean).pop()
      return filename?.replace(/^\d+_[a-z0-9-]+_/i, "") || "Unknown file"
    } catch {
      return "Unknown file"
    }
  }
}
