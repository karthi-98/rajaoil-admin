"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Pencil, Trash2, Plus, Package, Tag, IndianRupee, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [isEditBrandDialogOpen, setIsEditBrandDialogOpen] = useState(false)
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false)
  const [isEditTypeDialogOpen, setIsEditTypeDialogOpen] = useState(false)
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Form state
  const [brand, setBrand] = useState("")
  const [mainImage, setMainImage] = useState("")
  const [category, setCategory] = useState("")

  // New type state
  const [newTypeName, setNewTypeName] = useState("")
  const [newTypePrice, setNewTypePrice] = useState("")
  const [newTypeImage, setNewTypeImage] = useState("")
  const [newTypeOffer, setNewTypeOffer] = useState("")

  // Single type edit state
  const [editTypeName, setEditTypeName] = useState("")
  const [editTypePrice, setEditTypePrice] = useState("")
  const [editTypeImage, setEditTypeImage] = useState("")
  const [editTypeOffer, setEditTypeOffer] = useState("")

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

  const fetchBrands = useCallback(async () => {
    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setCategories(data.category || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchProduct()
    fetchBrands()
    fetchCategories()
  }, [fetchProduct, fetchBrands, fetchCategories])

  const handleEdit = () => {
    if (!product) return
    setBrand(product.brand)
    setMainImage(product.mainImage || "")
    setCategory(product.category || "")
    setIsEditBrandDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!product) return

    try {
      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, {
        brand,
        mainImage: mainImage || "",
        category: category || ""
      })
      setProduct({ ...product, brand, mainImage: mainImage || "", category: category || "" })
      setIsEditBrandDialogOpen(false)
    } catch (error) {
      console.error("Error updating product:", error)
      alert("Failed to update product")
    }
  }

  const handleAddNewType = async () => {
    if (!product) return
    if (!newTypeName.trim() || !newTypePrice.trim()) {
      alert("Please enter both name and price")
      return
    }

    try {
      const newType: OilType = {
        name: newTypeName,
        price: newTypePrice,
        image: newTypeImage || "",
        offer: newTypeOffer || ""
      }

      const updatedTypes = [...product.types, newType]
      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, { types: updatedTypes })

      setProduct({ ...product, types: updatedTypes })
      setIsAddTypeDialogOpen(false)
      setNewTypeName("")
      setNewTypePrice("")
      setNewTypeImage("")
      setNewTypeOffer("")
    } catch (error) {
      console.error("Error adding type:", error)
      alert("Failed to add type")
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productId}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "rajaoil", productId))
      router.push("/products")
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product")
    }
  }


  const handleEditType = (index: number) => {
    if (!product) return
    const type = product.types[index]
    setEditingTypeIndex(index)
    setEditTypeName(type.name)
    setEditTypePrice(type.price)
    setEditTypeImage(type.image || "")
    setEditTypeOffer(type.offer || "")
    setIsEditTypeDialogOpen(true)
  }

  const handleUpdateType = async () => {
    if (!product || editingTypeIndex === null) return

    try {
      const updatedTypes = [...product.types]
      updatedTypes[editingTypeIndex] = {
        name: editTypeName,
        price: editTypePrice,
        image: editTypeImage,
        offer: editTypeOffer
      }

      const productRef = doc(db, "rajaoil", productId)
      await updateDoc(productRef, { types: updatedTypes })

      setProduct({ ...product, types: updatedTypes })
      setIsEditTypeDialogOpen(false)
      setEditingTypeIndex(null)
    } catch (error) {
      console.error("Error updating type:", error)
      alert("Failed to update type")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Link href="/products">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4 hover:cursor-pointer"  />
            Back to Products
          </Button>
        </Link>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error || "Product not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The product you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Link href="/products">
              <Button>View All Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Link href="/products">
          <Button variant="ghost" className="gap-2  hover:cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </Link>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setIsAddTypeDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Packaging Type
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Header with Image */}
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {/* Main Product Image */}
        <div className="relative w-full h-80">
          {product.mainImage ? (
            <img
              src={product.mainImage}
              alt={productId}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-24 w-24 text-gray-300" />
            </div>
          )}
        </div>

        {/* Product Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h1 className="text-2xl font-semibold text-white">{productId}</h1>
          <p className="text-sm text-white/90 mt-1">Brand: {product.brand}</p>
        </div>
      </div>

      {/* Types & Pricing */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Available Packages</h2>
          <p className="text-sm text-gray-500 mt-1">Select from different packaging options</p>
        </div>

        {product.types.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No types available for this product
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {product.types.map((type, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow relative group">
                {/* Edit Button */}
                <button
                  onClick={() => handleEditType(index)}
                  className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Pencil className="h-4 w-4 text-gray-600" />
                </button>

                {/* Image */}
                <div className="relative h-32 bg-gray-100">
                  {type.image ? (
                    <img
                      src={type.image}
                      alt={type.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{type.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold text-gray-900">₹{type.price}</span>
                  </div>
                  {type.offer && (
                    <Badge variant="secondary" className="text-xs">
                      {type.offer}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditBrandDialogOpen} onOpenChange={setIsEditBrandDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the brand, category and main image for {productId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand Name</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
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
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="edit-main-image">Main Image URL</Label>
              <Input
                id="edit-main-image"
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="e.g., https://example.com/image.jpg"
              />
              {mainImage && (
                <div className="mt-2">
                  <img
                    src={mainImage}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBrandDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Type Dialog */}
      <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Type</DialogTitle>
            <DialogDescription>
              Add a new type variant for {productId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-type-name">Name</Label>
              <Input
                id="new-type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., 15 KG Tin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-type-price">Price</Label>
              <Input
                id="new-type-price"
                value={newTypePrice}
                onChange={(e) => setNewTypePrice(e.target.value)}
                placeholder="e.g., 2750"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-type-image">Image URL</Label>
              <Input
                id="new-type-image"
                value={newTypeImage}
                onChange={(e) => setNewTypeImage(e.target.value)}
                placeholder="e.g., https://example.com/image.jpg"
              />
              {newTypeImage && (
                <div className="mt-2">
                  <img
                    src={newTypeImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-type-offer">Offer (Optional)</Label>
              <Input
                id="new-type-offer"
                value={newTypeOffer}
                onChange={(e) => setNewTypeOffer(e.target.value)}
                placeholder="e.g., Festival Offer, Limited Stock"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewType}>Add Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Single Type Dialog */}
      <Dialog open={isEditTypeDialogOpen} onOpenChange={setIsEditTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Type</DialogTitle>
            <DialogDescription>
              Update the details for this product type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Name</Label>
              <Input
                id="type-name"
                value={editTypeName}
                onChange={(e) => setEditTypeName(e.target.value)}
                placeholder="e.g., 15 KG Tin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-price">Price</Label>
              <Input
                id="type-price"
                value={editTypePrice}
                onChange={(e) => setEditTypePrice(e.target.value)}
                placeholder="e.g., 2750"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-image">Image URL</Label>
              <Input
                id="type-image"
                value={editTypeImage}
                onChange={(e) => setEditTypeImage(e.target.value)}
                placeholder="e.g., https://example.com/image.jpg"
              />
              {editTypeImage && (
                <div className="mt-2">
                  <img
                    src={editTypeImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-offer">Offer (Optional)</Label>
              <Input
                id="type-offer"
                value={editTypeOffer}
                onChange={(e) => setEditTypeOffer(e.target.value)}
                placeholder="e.g., Festival Offer, Limited Stock"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateType}>Update Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
