"use client"

import { useState, useEffect, useRef } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Image as ImageIcon, Copy, Trash2, Upload, CheckCircle2, XCircle, Check, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface UploadProgress {
  fileName: string
  progress: number
  status: "uploading" | "completed" | "error"
  downloadURL?: string
}

interface DeleteProgress {
  imageUrl: string
  index: number
  status: "deleting" | "completed" | "error"
}

export default function OthersPage() {
  // Images section state
  const [images, setImages] = useState<string[]>([])
  const [imagesSelectionMode, setImagesSelectionMode] = useState(false)
  const [selectedImagesIndices, setSelectedImagesIndices] = useState<number[]>([])
  const [imagesUploading, setImagesUploading] = useState(false)
  const [imagesUploadDialogOpen, setImagesUploadDialogOpen] = useState(false)
  const [imagesUploadProgress, setImagesUploadProgress] = useState<UploadProgress[]>([])
  const [imagesDeleting, setImagesDeleting] = useState(false)
  const [imagesDeleteDialogOpen, setImagesDeleteDialogOpen] = useState(false)
  const [imagesDeleteProgress, setImagesDeleteProgress] = useState<DeleteProgress[]>([])
  const imagesFileInputRef = useRef<HTMLInputElement>(null)

  // Homepage Slider section state
  const [homepageSlider, setHomepageSlider] = useState<string[]>([])

  // General state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setImages(data.images || [])
        setHomepageSlider(data.homepageSlider || [])
      } else {
        setError("Others document not found")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // ============= IMAGES SECTION HANDLERS =============

  const handleImagesUploadClick = () => {
    imagesFileInputRef.current?.click()
  }

  const handleImagesFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const initialProgress: UploadProgress[] = Array.from(files).map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading" as const,
    }))

    setImagesUploadProgress(initialProgress)
    setImagesUploadDialogOpen(true)
    setImagesUploading(true)

    try {
      const uploadPromises = Array.from(files).map((file, index) => {
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(7)
        const fileName = `${timestamp}_${randomSuffix}_${file.name}`
        const storageRef = ref(storage, `rajaoil/${fileName}`)
        const uploadTask = uploadBytesResumable(storageRef, file)

        return new Promise<string | null>((resolve) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setImagesUploadProgress((prev) =>
                prev.map((item, idx) =>
                  idx === index ? { ...item, progress } : item
                )
              )
            },
            (error) => {
              console.error(`Error uploading ${file.name}:`, error)
              setImagesUploadProgress((prev) =>
                prev.map((item, idx) =>
                  idx === index ? { ...item, status: "error" as const, progress: 0 } : item
                )
              )
              resolve(null)
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                setImagesUploadProgress((prev) =>
                  prev.map((item, idx) =>
                    idx === index
                      ? { ...item, progress: 100, status: "completed" as const, downloadURL }
                      : item
                  )
                )
                resolve(downloadURL)
              } catch (error) {
                console.error(`Error getting download URL for ${file.name}:`, error)
                setImagesUploadProgress((prev) =>
                  prev.map((item, idx) =>
                    idx === index ? { ...item, status: "error" as const } : item
                  )
                )
                resolve(null)
              }
            }
          )
        })
      })

      const uploadResults = await Promise.all(uploadPromises)
      const uploadedURLs = uploadResults.filter((url): url is string => url !== null)

      if (uploadedURLs.length > 0) {
        const updatedImages = [...images, ...uploadedURLs]
        const docRef = doc(db, "rajaoil", "others")
        await updateDoc(docRef, { images: updatedImages })
        setImages(updatedImages)
      }

      if (imagesFileInputRef.current) {
        imagesFileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading images:", error)
    } finally {
      setImagesUploading(false)
    }
  }

  const handleDeleteImage = async (index: number) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return
    }

    try {
      const imageUrl = images[index]

      try {
        const decodedUrl = decodeURIComponent(imageUrl)
        const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1]
          const storageRef = ref(storage, filePath)
          await deleteObject(storageRef)
          console.log("Image deleted from storage:", filePath)
        }
      } catch (storageError) {
        console.error("Error deleting from storage:", storageError)
      }

      const updatedImages = images.filter((_, i) => i !== index)
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { images: updatedImages })
      setImages(updatedImages)
      alert("Image deleted successfully!")
    } catch (error) {
      console.error("Error deleting image:", error)
      alert("Failed to delete image")
    }
  }

  const toggleImagesSelectionMode = () => {
    setImagesSelectionMode(!imagesSelectionMode)
    setSelectedImagesIndices([])
  }

  const toggleImageSelection = (index: number) => {
    setSelectedImagesIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const handleDeleteSelectedImages = async () => {
    if (selectedImagesIndices.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedImagesIndices.length} image(s)?`)) {
      return
    }

    const initialProgress: DeleteProgress[] = selectedImagesIndices.map((index) => ({
      imageUrl: images[index],
      index,
      status: "deleting" as const,
    }))

    setImagesDeleteProgress(initialProgress)
    setImagesDeleteDialogOpen(true)
    setImagesDeleting(true)

    try {
      for (let i = 0; i < selectedImagesIndices.length; i++) {
        const index = selectedImagesIndices[i]
        const imageUrl = images[index]

        try {
          const decodedUrl = decodeURIComponent(imageUrl)
          const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
          if (pathMatch && pathMatch[1]) {
            const filePath = pathMatch[1]
            const storageRef = ref(storage, filePath)
            await deleteObject(storageRef)
            console.log("Image deleted from storage:", filePath)
          }

          setImagesDeleteProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "completed" as const } : item
            )
          )
        } catch (error) {
          console.error("Error deleting image:", error)
          setImagesDeleteProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "error" as const } : item
            )
          )
        }
      }

      const updatedImages = images.filter((_, index) => !selectedImagesIndices.includes(index))
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { images: updatedImages })
      setImages(updatedImages)
      setSelectedImagesIndices([])
      setImagesSelectionMode(false)
    } catch (error) {
      console.error("Error deleting images:", error)
    } finally {
      setImagesDeleting(false)
    }
  }

  // ============= HOMEPAGE SLIDER SECTION HANDLERS =============

  const handleAddToSlider = async (imageUrl: string) => {
    try {
      // Check if image already exists in slider
      if (homepageSlider.includes(imageUrl)) {
        alert("This image is already in the homepage slider!")
        return
      }

      const updatedSlider = [...homepageSlider, imageUrl]
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { homepageSlider: updatedSlider })
      setHomepageSlider(updatedSlider)
      alert("Image added to homepage slider!")
    } catch (error) {
      console.error("Error adding image to slider:", error)
      alert("Failed to add image to slider")
    }
  }

  const handleRemoveFromSlider = async (index: number) => {
    if (!confirm("Are you sure you want to remove this image from the slider?")) {
      return
    }

    try {
      const updatedSlider = homepageSlider.filter((_, i) => i !== index)
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { homepageSlider: updatedSlider })
      setHomepageSlider(updatedSlider)
      alert("Image removed from slider successfully!")
    } catch (error) {
      console.error("Error removing image from slider:", error)
      alert("Failed to remove image from slider")
    }
  }

  // ============= COMMON HANDLERS =============

  const getFileNameFromUrl = (url: string): string => {
    try {
      const decodedUrl = decodeURIComponent(url)
      // Extract filename from Firebase Storage URL
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
      if (pathMatch && pathMatch[1]) {
        const fullPath = pathMatch[1]
        // Get the last part after the last slash
        const parts = fullPath.split('/')
        const filename = parts[parts.length - 1]
        // Remove the timestamp and random suffix (e.g., "1234567890_abc123_filename.jpg" -> "filename.jpg")
        const cleanFilename = filename.replace(/^\d+_[a-z0-9]+_/i, '')
        return cleanFilename
      }
    } catch (error) {
      console.error("Error extracting filename:", error)
    }
    return "Unknown file"
  }

  const handleCopyLink = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      alert("Link copied to clipboard!")
    } catch (error) {
      console.error("Error copying link:", error)
      alert("Failed to copy link")
    }
  }

  // ============= RENDER =============

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was an error loading the data.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============= IMAGES SECTION ============= */}
      <Card className="shadow-none border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Images</CardTitle>
              <CardDescription>
                General images for the website
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {!imagesSelectionMode && (
                <Badge variant="secondary">
                  {images.length} {images.length === 1 ? 'Image' : 'Images'}
                </Badge>
              )}
              {imagesSelectionMode && (
                <Badge variant="secondary">
                  {selectedImagesIndices.length} Selected
                </Badge>
              )}
              <input
                ref={imagesFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagesFileChange}
              />
              {!imagesSelectionMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={toggleImagesSelectionMode}
                    disabled={imagesUploading || images.length === 0}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Select
                  </Button>
                  <Button onClick={handleImagesUploadClick} disabled={imagesUploading} className="gap-2">
                    {imagesUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Images
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={toggleImagesSelectionMode}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelectedImages}
                    disabled={selectedImagesIndices.length === 0}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedImagesIndices.length})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {images.map((imageUrl, index) => {
                const isSelected = selectedImagesIndices.includes(index)
                const filename = getFileNameFromUrl(imageUrl)
                return (
                  <div key={index} className="flex flex-col space-y-2">
                    <div
                      className={`relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group ${
                        imagesSelectionMode ? 'cursor-pointer' : ''
                      } ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
                      onClick={() => imagesSelectionMode && toggleImageSelection(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = ''
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <svg class="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-sm">Failed to load image</p>
                              </div>
                            `
                          }
                        }}
                      />

                      {imagesSelectionMode && (
                        <div className="absolute top-2 right-2 z-10">
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                        </div>
                      )}

                      {!imagesSelectionMode && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1"
                            onClick={() => handleCopyLink(imageUrl)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1"
                            onClick={() => handleAddToSlider(imageUrl)}
                          >
                            <Plus className="h-4 w-4" />
                            Add to
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => handleDeleteImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate px-1" title={filename}>
                      {filename}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============= HOMEPAGE SLIDER SECTION ============= */}
      <Card className="shadow-none border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Homepage Slider Images</CardTitle>
              <CardDescription>
                Images displayed on the homepage slider
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {homepageSlider.length} {homepageSlider.length === 1 ? 'Image' : 'Images'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {homepageSlider.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No images in the homepage slider</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {homepageSlider.map((imageUrl, index) => {
                const filename = getFileNameFromUrl(imageUrl)
                return (
                  <div key={index} className="flex flex-col space-y-2">
                    <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group">
                      <img
                        src={imageUrl}
                        alt={`Slider image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = ''
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <svg class="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-sm">Failed to load image</p>
                              </div>
                            `
                          }
                        }}
                      />

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleRemoveFromSlider(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 truncate px-1" title={filename}>
                      {filename}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============= IMAGES UPLOAD DIALOG ============= */}
      <Dialog open={imagesUploadDialogOpen} onOpenChange={(open) => !imagesUploading && setImagesUploadDialogOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploading Images</DialogTitle>
            <DialogDescription>
              {imagesUploading
                ? `Uploading ${imagesUploadProgress.length} image(s) to storage...`
                : `Upload complete! ${imagesUploadProgress.filter((p) => p.status === "completed").length} of ${imagesUploadProgress.length} image(s) uploaded successfully.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
            {imagesUploadProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.status === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {item.status === "error" && (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate" title={item.fileName}>
                      {item.fileName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <Progress value={item.progress} className="h-2" />
                {item.status === "error" && (
                  <p className="text-xs text-red-600">Failed to upload</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setImagesUploadDialogOpen(false)}
              disabled={imagesUploading}
            >
              {imagesUploading ? "Uploading..." : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= IMAGES DELETE DIALOG ============= */}
      <Dialog open={imagesDeleteDialogOpen} onOpenChange={(open) => !imagesDeleting && setImagesDeleteDialogOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deleting Images</DialogTitle>
            <DialogDescription>
              {imagesDeleting
                ? `Deleting ${imagesDeleteProgress.length} image(s) from storage...`
                : `Delete complete! ${imagesDeleteProgress.filter((p) => p.status === "completed").length} of ${imagesDeleteProgress.length} image(s) deleted successfully.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
            {imagesDeleteProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.status === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {item.status === "error" && (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    {item.status === "deleting" && (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate" title={item.imageUrl}>
                      Image {item.index + 1}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    {item.status === "completed" && "Deleted"}
                    {item.status === "deleting" && "Deleting..."}
                    {item.status === "error" && "Failed"}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.status === "completed"
                        ? "w-full bg-green-600"
                        : item.status === "error"
                        ? "w-full bg-red-600"
                        : "w-1/2 bg-blue-600 animate-pulse"
                    }`}
                  />
                </div>
                {item.status === "error" && (
                  <p className="text-xs text-red-600">Failed to delete from storage</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setImagesDeleteDialogOpen(false)}
              disabled={imagesDeleting}
            >
              {imagesDeleting ? "Deleting..." : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
