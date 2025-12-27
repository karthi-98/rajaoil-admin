"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2,
  Image as ImageIcon,
  Copy,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  Check,
  Plus,
  ImagePlus,
  Layers,
  X,
  ExternalLink,
  GripVertical
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

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

  // Drag and drop state for upload
  const [isDragging, setIsDragging] = useState(false)

  // Drag and drop state for slider reordering
  const [draggedSliderIndex, setDraggedSliderIndex] = useState<number | null>(null)
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null)

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'multiple' | 'slider', index?: number }>({ type: 'single' })

  // Add to slider confirmation dialog state
  const [addToSliderConfirmOpen, setAddToSliderConfirmOpen] = useState(false)
  const [imageToAddToSlider, setImageToAddToSlider] = useState<string | null>(null)

  // General state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("library")

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

  // ============= DRAG AND DROP HANDLERS =============

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFilesUpload(files)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============= IMAGES SECTION HANDLERS =============

  const handleImagesUploadClick = () => {
    imagesFileInputRef.current?.click()
  }

  const handleImagesFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    handleFilesUpload(files)
    if (imagesFileInputRef.current) {
      imagesFileInputRef.current.value = ""
    }
  }

  const handleFilesUpload = async (files: FileList) => {
    // Filter only image files
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      toast.error("No valid image files selected")
      return
    }

    if (imageFiles.length !== files.length) {
      toast.warning(`${files.length - imageFiles.length} non-image file(s) were skipped`)
    }

    const initialProgress: UploadProgress[] = imageFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading" as const,
    }))

    setImagesUploadProgress(initialProgress)
    setImagesUploadDialogOpen(true)
    setImagesUploading(true)

    try {
      const uploadPromises = imageFiles.map((file, index) => {
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
        toast.success(`${uploadedURLs.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload images")
    } finally {
      setImagesUploading(false)
    }
  }

  const confirmDeleteImage = (index: number) => {
    setDeleteTarget({ type: 'single', index })
    setDeleteConfirmOpen(true)
  }

  const handleDeleteImage = async () => {
    if (deleteTarget.type !== 'single' || deleteTarget.index === undefined) return

    const index = deleteTarget.index
    try {
      const imageUrl = images[index]

      try {
        const decodedUrl = decodeURIComponent(imageUrl)
        const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1]
          const storageRef = ref(storage, filePath)
          await deleteObject(storageRef)
        }
      } catch (storageError) {
        console.error("Error deleting from storage:", storageError)
      }

      const updatedImages = images.filter((_, i) => i !== index)
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { images: updatedImages })
      setImages(updatedImages)
      toast.success("Image deleted successfully")
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image")
    } finally {
      setDeleteConfirmOpen(false)
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

  const selectAllImages = () => {
    if (selectedImagesIndices.length === images.length) {
      setSelectedImagesIndices([])
    } else {
      setSelectedImagesIndices(images.map((_, i) => i))
    }
  }

  const confirmDeleteSelectedImages = () => {
    if (selectedImagesIndices.length === 0) return
    setDeleteTarget({ type: 'multiple' })
    setDeleteConfirmOpen(true)
  }

  const handleDeleteSelectedImages = async () => {
    if (selectedImagesIndices.length === 0) return

    const initialProgress: DeleteProgress[] = selectedImagesIndices.map((index) => ({
      imageUrl: images[index],
      index,
      status: "deleting" as const,
    }))

    setImagesDeleteProgress(initialProgress)
    setImagesDeleteDialogOpen(true)
    setImagesDeleting(true)
    setDeleteConfirmOpen(false)

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
      toast.success(`${selectedImagesIndices.length} image(s) deleted successfully`)
    } catch (error) {
      console.error("Error deleting images:", error)
      toast.error("Failed to delete some images")
    } finally {
      setImagesDeleting(false)
    }
  }

  // ============= HOMEPAGE SLIDER SECTION HANDLERS =============

  const confirmAddToSlider = (imageUrl: string) => {
    if (homepageSlider.includes(imageUrl)) {
      toast.error("This image is already in the homepage slider")
      return
    }
    setImageToAddToSlider(imageUrl)
    setAddToSliderConfirmOpen(true)
  }

  const handleAddToSlider = async () => {
    if (!imageToAddToSlider) return

    try {
      const updatedSlider = [...homepageSlider, imageToAddToSlider]
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { homepageSlider: updatedSlider })
      setHomepageSlider(updatedSlider)
      toast.success("Image added to homepage slider")
    } catch (error) {
      console.error("Error adding image to slider:", error)
      toast.error("Failed to add image to slider")
    } finally {
      setAddToSliderConfirmOpen(false)
      setImageToAddToSlider(null)
    }
  }

  const confirmRemoveFromSlider = (index: number) => {
    setDeleteTarget({ type: 'slider', index })
    setDeleteConfirmOpen(true)
  }

  const handleRemoveFromSlider = async () => {
    if (deleteTarget.type !== 'slider' || deleteTarget.index === undefined) return

    try {
      const updatedSlider = homepageSlider.filter((_, i) => i !== deleteTarget.index)
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { homepageSlider: updatedSlider })
      setHomepageSlider(updatedSlider)
      toast.success("Image removed from slider")
    } catch (error) {
      console.error("Error removing image from slider:", error)
      toast.error("Failed to remove image from slider")
    } finally {
      setDeleteConfirmOpen(false)
    }
  }

  // Slider reordering handlers
  const handleSliderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSliderIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleSliderDragEnd = () => {
    setDraggedSliderIndex(null)
    setDropInsertIndex(null)
  }

  const handleSliderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedSliderIndex === null) return

    // Get the bounding rectangle of the current item
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2

    // Determine if we're in the top or bottom half
    let insertIndex: number
    if (e.clientY < midY) {
      // Top half - insert before this item
      insertIndex = index
    } else {
      // Bottom half - insert after this item
      insertIndex = index + 1
    }

    // Don't show gap at the dragged item's current position or the position right after it
    if (insertIndex === draggedSliderIndex || insertIndex === draggedSliderIndex + 1) {
      setDropInsertIndex(null)
    } else {
      setDropInsertIndex(insertIndex)
    }
  }

  const handleSliderContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSliderContainerDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the container entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setDropInsertIndex(null)
    }
  }

  const handleSliderDrop = async (e: React.DragEvent) => {
    e.preventDefault()

    if (draggedSliderIndex === null || dropInsertIndex === null) {
      setDraggedSliderIndex(null)
      setDropInsertIndex(null)
      return
    }

    // Calculate the actual target index after removal
    let targetIndex = dropInsertIndex
    if (draggedSliderIndex < dropInsertIndex) {
      targetIndex = dropInsertIndex - 1
    }

    if (draggedSliderIndex === targetIndex) {
      setDraggedSliderIndex(null)
      setDropInsertIndex(null)
      return
    }

    // Reorder the array
    const newSlider = [...homepageSlider]
    const [draggedItem] = newSlider.splice(draggedSliderIndex, 1)
    newSlider.splice(targetIndex, 0, draggedItem)

    // Update local state immediately for responsive UI
    setHomepageSlider(newSlider)
    setDraggedSliderIndex(null)
    setDropInsertIndex(null)

    // Save to Firebase
    try {
      const docRef = doc(db, "rajaoil", "others")
      await updateDoc(docRef, { homepageSlider: newSlider })
      toast.success("Slider order updated")
    } catch (error) {
      console.error("Error updating slider order:", error)
      toast.error("Failed to update slider order")
      // Revert on error
      setHomepageSlider(homepageSlider)
    }
  }

  // ============= COMMON HANDLERS =============

  const getFileNameFromUrl = (url: string): string => {
    try {
      const decodedUrl = decodeURIComponent(url)
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/)
      if (pathMatch && pathMatch[1]) {
        const fullPath = pathMatch[1]
        const parts = fullPath.split('/')
        const filename = parts[parts.length - 1]
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
      toast.success("Link copied to clipboard")
    } catch (error) {
      console.error("Error copying link:", error)
      toast.error("Failed to copy link")
    }
  }

  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank')
  }

  // ============= RENDER =============

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading media library...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-destructive">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={fetchData} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-20">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage your website images and homepage slider content
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="library" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Library
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {images.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="slider" className="gap-2">
              <Layers className="h-4 w-4" />
              Homepage Slider
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {homepageSlider.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Image Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Upload Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={imagesFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagesFileChange}
              />
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <ImagePlus className={`h-8 w-8 transition-colors ${
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragging ? 'Drop images here' : 'Drag and drop images here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click the button below to select files
                  </p>
                </div>
                <Button
                  onClick={handleImagesUploadClick}
                  disabled={imagesUploading}
                  size="lg"
                  className="gap-2"
                >
                  {imagesUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select Images
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Selection Mode Header */}
            {images.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">All Images</h2>
                  {imagesSelectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllImages}
                      className="text-xs"
                    >
                      {selectedImagesIndices.length === images.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
                <Button
                  variant={imagesSelectionMode ? "secondary" : "outline"}
                  onClick={toggleImagesSelectionMode}
                  disabled={imagesUploading}
                  size="sm"
                  className="gap-2"
                >
                  {imagesSelectionMode ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Select
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Image Grid */}
            {images.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">No images yet</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Upload your first image using the upload zone above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {images.map((imageUrl, index) => {
                  const isSelected = selectedImagesIndices.includes(index)
                  const filename = getFileNameFromUrl(imageUrl)
                  const isInSlider = homepageSlider.includes(imageUrl)

                  return (
                    <div
                      key={index}
                      className={`group relative rounded-xl overflow-hidden bg-muted transition-all duration-200 ${
                        imagesSelectionMode
                          ? 'cursor-pointer hover:ring-2 hover:ring-primary/50'
                          : ''
                      } ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}`}
                      onClick={() => imagesSelectionMode && toggleImageSelection(index)}
                    >
                      {/* Image */}
                      <div className="aspect-square">
                        <img
                          src={imageUrl}
                          alt={filename}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      </div>

                      {/* In Slider Badge */}
                      {isInSlider && !imagesSelectionMode && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs shadow-md">
                            <Layers className="h-3 w-3 mr-1" />
                            Slider
                          </Badge>
                        </div>
                      )}

                      {/* Selection Checkbox */}
                      {imagesSelectionMode && (
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${
                              isSelected
                                ? 'bg-primary border-primary scale-110'
                                : 'bg-white/90 border-white hover:border-primary'
                            }`}
                          >
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                        </div>
                      )}

                      {/* Hover Actions */}
                      {!imagesSelectionMode && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                            <p className="text-white text-xs font-medium truncate" title={filename}>
                              {filename}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openImageInNewTab(imageUrl)
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open in new tab</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyLink(imageUrl)
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy link</TooltipContent>
                              </Tooltip>

                              {!isInSlider && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        confirmAddToSlider(imageUrl)
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Add to slider</TooltipContent>
                                </Tooltip>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      confirmDeleteImage(index)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Homepage Slider Tab */}
          <TabsContent value="slider" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Slider Images</h2>
                <p className="text-sm text-muted-foreground">
                  Drag and drop to reorder. These images will appear in the homepage carousel.
                </p>
              </div>
            </div>

            {homepageSlider.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">No slider images</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                  Add images from the Image Library tab by clicking the &quot;+&quot; button on any image
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("library")}
                >
                  Go to Image Library
                </Button>
              </div>
            ) : (
              <div
                className="space-y-2"
                onDragOver={handleSliderContainerDragOver}
                onDragLeave={handleSliderContainerDragLeave}
                onDrop={handleSliderDrop}
              >
                {homepageSlider.map((imageUrl, index) => {
                  const filename = getFileNameFromUrl(imageUrl)
                  const isBeingDragged = draggedSliderIndex === index
                  const showDropIndicatorBefore = dropInsertIndex === index

                  return (
                    <div key={imageUrl}>
                      {/* Drop indicator before this item */}
                      {showDropIndicatorBefore && (
                        <div className="h-16 mb-2 rounded-xl border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center transition-all duration-200 animate-pulse">
                          <p className="text-sm text-primary font-medium">Drop here</p>
                        </div>
                      )}

                      <div
                        draggable
                        onDragStart={(e) => handleSliderDragStart(e, index)}
                        onDragEnd={handleSliderDragEnd}
                        onDragOver={(e) => handleSliderDragOver(e, index)}
                        className={`group flex items-center gap-4 p-3 rounded-xl border bg-card transition-all duration-200 select-none ${
                          isBeingDragged
                            ? 'opacity-40 scale-[0.98] border-dashed'
                            : 'hover:bg-muted/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-muted-foreground cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <span className="w-6 text-center font-medium text-sm">
                            {index + 1}
                          </span>
                        </div>

                        <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 pointer-events-none">
                          <img
                            src={imageUrl}
                            alt={filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            draggable={false}
                          />
                        </div>

                        <div className="flex-1 min-w-0 pointer-events-none">
                          <p className="font-medium text-sm truncate" title={filename}>
                            {filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Slide {index + 1} of {homepageSlider.length}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => openImageInNewTab(imageUrl)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open in new tab</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleCopyLink(imageUrl)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy link</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => confirmRemoveFromSlider(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove from slider</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Drop indicator after the last item */}
                      {index === homepageSlider.length - 1 && dropInsertIndex === homepageSlider.length && (
                        <div className="h-16 mt-2 rounded-xl border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center transition-all duration-200 animate-pulse">
                          <p className="text-sm text-primary font-medium">Drop here</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Selection Mode Floating Action Bar */}
        {imagesSelectionMode && selectedImagesIndices.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 bg-background border rounded-full shadow-xl px-4 py-3">
              <Badge variant="secondary" className="text-sm">
                {selectedImagesIndices.length} selected
              </Badge>
              <div className="w-px h-6 bg-border" />
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteSelectedImages}
                className="gap-2 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleImagesSelectionMode}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteTarget.type === 'multiple'
                  ? `Delete ${selectedImagesIndices.length} images?`
                  : deleteTarget.type === 'slider'
                  ? 'Remove from slider?'
                  : 'Delete image?'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget.type === 'multiple'
                  ? 'This will permanently delete the selected images from storage. This action cannot be undone.'
                  : deleteTarget.type === 'slider'
                  ? 'This will remove the image from the homepage slider. The image will still be available in your library.'
                  : 'This will permanently delete the image from storage. This action cannot be undone.'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget.type === 'multiple') {
                    handleDeleteSelectedImages()
                  } else if (deleteTarget.type === 'slider') {
                    handleRemoveFromSlider()
                  } else {
                    handleDeleteImage()
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTarget.type === 'slider' ? 'Remove' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add to Slider Confirmation Dialog */}
        <AlertDialog open={addToSliderConfirmOpen} onOpenChange={setAddToSliderConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add to Homepage Slider?</AlertDialogTitle>
              <AlertDialogDescription>
                This image will be added to the homepage slider and will be visible to all visitors on the homepage carousel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {imageToAddToSlider && (
              <div className="my-4 rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imageToAddToSlider}
                  alt="Image to add"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setImageToAddToSlider(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleAddToSlider}>
                Add to Slider
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Upload Progress Dialog */}
        <Dialog open={imagesUploadDialogOpen} onOpenChange={(open) => !imagesUploading && setImagesUploadDialogOpen(open)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {imagesUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Uploading Images
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Upload Complete
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {imagesUploading
                  ? `Uploading ${imagesUploadProgress.length} image(s)...`
                  : `${imagesUploadProgress.filter((p) => p.status === "completed").length} of ${imagesUploadProgress.length} uploaded successfully`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[300px] overflow-y-auto py-2">
              {imagesUploadProgress.map((item, index) => (
                <div key={index} className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      {item.status === "error" && (
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      {item.status === "uploading" && (
                        <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {Math.round(item.progress)}%
                    </span>
                  </div>
                  <Progress value={item.progress} className="h-1.5" />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
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

        {/* Delete Progress Dialog */}
        <Dialog open={imagesDeleteDialogOpen} onOpenChange={(open) => !imagesDeleting && setImagesDeleteDialogOpen(open)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {imagesDeleting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-destructive" />
                    Deleting Images
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Deletion Complete
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {imagesDeleting
                  ? `Deleting ${imagesDeleteProgress.length} image(s)...`
                  : `${imagesDeleteProgress.filter((p) => p.status === "completed").length} of ${imagesDeleteProgress.length} deleted successfully`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[300px] overflow-y-auto py-2">
              {imagesDeleteProgress.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {item.status === "completed" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  {item.status === "error" && (
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                  {item.status === "deleting" && (
                    <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium flex-1">
                    Image {item.index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.status === "completed" && "Deleted"}
                    {item.status === "deleting" && "Deleting..."}
                    {item.status === "error" && "Failed"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
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
    </TooltipProvider>
  )
}
