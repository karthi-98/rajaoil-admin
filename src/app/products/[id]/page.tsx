"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Package,
  IndianRupee,
  Loader2,
  Building2,
  FolderOpen,
  Tag,
  ChevronRight,
  Layers
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface OilType {
  name: string
  price: string
  image?: string
  offer?: string
}

interface ProductData {
  brand: string
  types: OilType[]
  mainImage?: string
  category?: string
}

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter()
  const productId = decodeURIComponent(params.id)

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddVariantDialogOpen, setIsAddVariantDialogOpen] = useState(false)
  const [isEditVariantDialogOpen, setIsEditVariantDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteVariantDialogOpen, setIsDeleteVariantDialogOpen] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  // Form state
  const [brand, setBrand] = useState("")
  const [mainImage, setMainImage] = useState("")
  const [category, setCategory] = useState("")

  // New variant state
  const [newVariantName, setNewVariantName] = useState("")
  const [newVariantPrice, setNewVariantPrice] = useState("")
  const [newVariantImage, setNewVariantImage] = useState("")
  const [newVariantOffer, setNewVariantOffer] = useState("")

  // Edit variant state
  const [editVariantName, setEditVariantName] = useState("")
  const [editVariantPrice, setEditVariantPrice] = useState("")
  const [editVariantImage, setEditVariantImage] = useState("")
  const [editVariantOffer, setEditVariantOffer] = useState("")

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const docRef = doc(db, "rajaoil", productId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as ProductData
        setProduct(data)
      } else {
        setError("Product not found")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      setError("Failed to load product details")
    } finally {
      setLoading(false)
    }
  }, [productId])

  const fetchBrandsAndCategories = useCallback(async () => {
    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setBrands(data.brands || [])
        setCategories(data.category || [])
      }
    } catch (error) {
      console.error("Error fetching brands/categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchProduct()
    fetchBrandsAndCategories()
  }, [fetchProduct, fetchBrandsAndCategories])

  const handleOpenEditDialog = () => {
    if (!product) return
    setBrand(product.brand)
    setMainImage(product.mainImage || "")
    setCategory(product.category || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!product) return

    setIsUpdating(true)
    try {
      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, {
        brand,
        mainImage: mainImage || "",
        category: category || ""
      })
      setProduct({ ...product, brand, mainImage: mainImage || "", category: category || "" })
      setIsEditDialogOpen(false)
      toast.success("Product updated successfully")
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddVariant = async () => {
    if (!product) return
    if (!newVariantName.trim() || !newVariantPrice.trim()) {
      toast.error("Please enter both name and price")
      return
    }

    setIsUpdating(true)
    try {
      const newVariant: OilType = {
        name: newVariantName,
        price: newVariantPrice,
        image: newVariantImage || "",
        offer: newVariantOffer || ""
      }

      const updatedTypes = [...product.types, newVariant]
      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, { types: updatedTypes })

      setProduct({ ...product, types: updatedTypes })
      setIsAddVariantDialogOpen(false)
      resetNewVariantForm()
      toast.success("Variant added successfully")
    } catch (error) {
      console.error("Error adding variant:", error)
      toast.error("Failed to add variant")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenEditVariantDialog = (index: number) => {
    if (!product) return
    const variant = product.types[index]
    setEditingVariantIndex(index)
    setEditVariantName(variant.name)
    setEditVariantPrice(variant.price)
    setEditVariantImage(variant.image || "")
    setEditVariantOffer(variant.offer || "")
    setIsEditVariantDialogOpen(true)
  }

  const handleUpdateVariant = async () => {
    if (!product || editingVariantIndex === null) return

    setIsUpdating(true)
    try {
      const updatedTypes = [...product.types]
      updatedTypes[editingVariantIndex] = {
        name: editVariantName,
        price: editVariantPrice,
        image: editVariantImage,
        offer: editVariantOffer
      }

      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, { types: updatedTypes })

      setProduct({ ...product, types: updatedTypes })
      setIsEditVariantDialogOpen(false)
      setEditingVariantIndex(null)
      toast.success("Variant updated successfully")
    } catch (error) {
      console.error("Error updating variant:", error)
      toast.error("Failed to update variant")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteVariant = async () => {
    if (!product || editingVariantIndex === null) return

    setIsUpdating(true)
    try {
      const updatedTypes = product.types.filter((_, i) => i !== editingVariantIndex)
      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, { types: updatedTypes })

      setProduct({ ...product, types: updatedTypes })
      setIsDeleteVariantDialogOpen(false)
      setIsEditVariantDialogOpen(false)
      setEditingVariantIndex(null)
      toast.success("Variant deleted successfully")
    } catch (error) {
      console.error("Error deleting variant:", error)
      toast.error("Failed to delete variant")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProduct = async () => {
    setIsUpdating(true)
    try {
      await deleteDoc(doc(db, "rajaoil", productId))
      toast.success("Product deleted successfully")
      router.push("/products")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
      setIsUpdating(false)
    }
  }

  const resetNewVariantForm = () => {
    setNewVariantName("")
    setNewVariantPrice("")
    setNewVariantImage("")
    setNewVariantOffer("")
  }

  const getLowestPrice = () => {
    if (!product || product.types.length === 0) return null
    const prices = product.types.map(t => parseFloat(t.price)).filter(p => !isNaN(p))
    if (prices.length === 0) return null
    return Math.min(...prices)
  }

  const getHighestPrice = () => {
    if (!product || product.types.length === 0) return null
    const prices = product.types.map(t => parseFloat(t.price)).filter(p => !isNaN(p))
    if (prices.length === 0) return null
    return Math.max(...prices)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground transition-colors">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Not Found</span>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Product Not Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || "The product you're looking for doesn't exist or has been deleted."}
                </p>
              </div>
              <Button asChild>
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lowestPrice = getLowestPrice()
  const highestPrice = getHighestPrice()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[300px]">{productId}</span>
      </div>

      {/* Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{productId}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            {product.brand && (
              <>
                <span className="text-sm">{product.brand}</span>
                {product.category && <span>·</span>}
              </>
            )}
            {product.category && (
              <span className="text-sm">{product.category}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAddVariantDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Product Image */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {product.mainImage ? (
                  <img
                    src={product.mainImage}
                    alt={productId}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price & Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Range */}
              {lowestPrice && highestPrice && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                  <div className="flex items-center gap-1 text-2xl font-semibold">
                    <IndianRupee className="h-5 w-5" />
                    <span>
                      {lowestPrice === highestPrice
                        ? lowestPrice.toLocaleString()
                        : `${lowestPrice.toLocaleString()} - ${highestPrice.toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Brand</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{product.brand || "Not set"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{product.category || "Not set"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Variants</p>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{product.types.length} variant{product.types.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Offers</p>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{product.types.filter(t => t.offer).length} active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Pricing Variants</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsAddVariantDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {product.types.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No variants added yet</p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddVariantDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Variant
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {product.types.map((variant, index) => (
                    <div
                      key={index}
                      onClick={() => handleOpenEditVariantDialog(index)}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {variant.image ? (
                          <img
                            src={variant.image}
                            alt={variant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{variant.name}</p>
                        {variant.offer && (
                          <Badge variant="secondary" className="mt-1 text-xs font-normal">
                            {variant.offer}
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₹{parseFloat(variant.price).toLocaleString()}</span>
                        <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brandName) => (
                    <SelectItem key={brandName} value={brandName}>
                      {brandName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((categoryName) => (
                    <SelectItem key={categoryName} value={categoryName}>
                      {categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Main Image URL</Label>
              <Input
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {mainImage && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={mainImage}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Variant Dialog */}
      <Dialog open={isAddVariantDialogOpen} onOpenChange={(open) => {
        setIsAddVariantDialogOpen(open)
        if (!open) resetNewVariantForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Variant</DialogTitle>
            <DialogDescription>
              Add a new packaging variant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size / Name <span className="text-destructive">*</span></Label>
                <Input
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  placeholder="e.g., 15 KG Tin"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  value={newVariantPrice}
                  onChange={(e) => setNewVariantPrice(e.target.value)}
                  placeholder="e.g., 2750"
                  type="number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Offer Tag</Label>
              <Input
                value={newVariantOffer}
                onChange={(e) => setNewVariantOffer(e.target.value)}
                placeholder="e.g., Festival Offer"
              />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={newVariantImage}
                onChange={(e) => setNewVariantImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {newVariantImage && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={newVariantImage}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVariantDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleAddVariant} disabled={isUpdating || !newVariantName.trim() || !newVariantPrice.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={isEditVariantDialogOpen} onOpenChange={setIsEditVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
            <DialogDescription>
              Update variant details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size / Name <span className="text-destructive">*</span></Label>
                <Input
                  value={editVariantName}
                  onChange={(e) => setEditVariantName(e.target.value)}
                  placeholder="e.g., 15 KG Tin"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  value={editVariantPrice}
                  onChange={(e) => setEditVariantPrice(e.target.value)}
                  placeholder="e.g., 2750"
                  type="number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Offer Tag</Label>
              <Input
                value={editVariantOffer}
                onChange={(e) => setEditVariantOffer(e.target.value)}
                placeholder="e.g., Festival Offer"
              />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={editVariantImage}
                onChange={(e) => setEditVariantImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {editVariantImage && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={editVariantImage}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteVariantDialogOpen(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditVariantDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdateVariant} disabled={isUpdating || !editVariantName.trim() || !editVariantPrice.trim()}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{productId}&quot; and all its variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Variant Confirmation */}
      <AlertDialog open={isDeleteVariantDialogOpen} onOpenChange={setIsDeleteVariantDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this variant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVariant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
