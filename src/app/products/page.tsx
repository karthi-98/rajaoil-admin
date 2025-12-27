"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, setDoc, doc, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  Plus,
  Trash2,
  Loader2,
  Package,
  Search,
  LayoutGrid,
  List,
  Layers,
  IndianRupee,
  X,
  PackagePlus,
  Building2,
  FolderOpen,
  ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

interface OilType {
  name: string
  price: string
  offer?: string
}

interface OilProduct {
  id: string
  name: string
  brand: string
  category?: string
  types: OilType[]
  mainImage?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<OilProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // View and filter state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("products")

  // Form state for adding products
  const [productName, setProductName] = useState("")
  const [productBrand, setProductBrand] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [oilTypes, setOilTypes] = useState<OilType[]>([{ name: "", price: "", offer: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Brand/Category management state
  const [newBrandName, setNewBrandName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'brand' | 'category', name: string } | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchBrandsAndCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, "rajaoil"), where("docType", "==", "product"))
      const querySnapshot = await getDocs(q)
      const productsData: OilProduct[] = []
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        productsData.push({
          id: docSnapshot.id,
          name: docSnapshot.id,
          brand: data.brand || "",
          category: data.category || "",
          types: data.types || [],
          mainImage: data.mainImage || "",
        })
      })
      // Sort by name
      productsData.sort((a, b) => a.name.localeCompare(b.name))
      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const fetchBrandsAndCategories = async () => {
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
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesBrand = selectedBrandFilter === "all" || product.brand === selectedBrandFilter
      const matchesCategory = selectedCategoryFilter === "all" || product.category === selectedCategoryFilter
      return matchesSearch && matchesBrand && matchesCategory
    })
  }, [products, searchQuery, selectedBrandFilter, selectedCategoryFilter])

  const handleAddType = () => {
    setOilTypes([...oilTypes, { name: "", price: "", offer: "" }])
  }

  const handleRemoveType = (index: number) => {
    const newTypes = oilTypes.filter((_, i) => i !== index)
    setOilTypes(newTypes)
  }

  const handleTypeChange = (index: number, field: "name" | "price" | "offer", value: string) => {
    const newTypes = [...oilTypes]
    newTypes[index][field] = value
    setOilTypes(newTypes)
  }

  const handleAddProduct = async () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name")
      return
    }

    const validTypes = oilTypes.filter(type => type.name && type.price)
    if (validTypes.length === 0) {
      toast.error("Please add at least one packaging type with name and price")
      return
    }

    setIsSubmitting(true)
    try {
      await setDoc(doc(db, "rajaoil", productName), {
        docType: "product",
        brand: productBrand,
        category: productCategory,
        types: validTypes,
      })
      setIsAddDialogOpen(false)
      resetForm()
      fetchProducts()
      toast.success("Product added successfully")
    } catch (error) {
      console.error("Error adding product:", error)
      toast.error("Failed to add product. The product name might already exist.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Please enter a brand name")
      return
    }

    if (brands.includes(newBrandName.trim())) {
      toast.error("This brand already exists")
      return
    }

    setIsAddingBrand(true)
    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      let updatedBrands = []
      if (docSnap.exists()) {
        updatedBrands = [...(docSnap.data().brands || []), newBrandName.trim()]
      } else {
        updatedBrands = [newBrandName.trim()]
      }

      await setDoc(docRef, { brands: updatedBrands }, { merge: true })
      setBrands(updatedBrands)
      setNewBrandName("")
      toast.success("Brand added successfully")
    } catch (error) {
      console.error("Error adding brand:", error)
      toast.error("Failed to add brand")
    } finally {
      setIsAddingBrand(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name")
      return
    }

    if (categories.includes(newCategoryName.trim())) {
      toast.error("This category already exists")
      return
    }

    setIsAddingCategory(true)
    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      let updatedCategories = []
      if (docSnap.exists()) {
        updatedCategories = [...(docSnap.data().category || []), newCategoryName.trim()]
      } else {
        updatedCategories = [newCategoryName.trim()]
      }

      await setDoc(docRef, { category: updatedCategories }, { merge: true })
      setCategories(updatedCategories)
      setNewCategoryName("")
      toast.success("Category added successfully")
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error("Failed to add category")
    } finally {
      setIsAddingCategory(false)
    }
  }

  const confirmDelete = (type: 'brand' | 'category', name: string) => {
    setItemToDelete({ type, name })
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return

    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        if (itemToDelete.type === 'brand') {
          const updatedBrands = (docSnap.data().brands || []).filter(
            (brand: string) => brand !== itemToDelete.name
          )
          await setDoc(docRef, { brands: updatedBrands }, { merge: true })
          setBrands(updatedBrands)
          toast.success("Brand deleted successfully")
        } else {
          const updatedCategories = (docSnap.data().category || []).filter(
            (category: string) => category !== itemToDelete.name
          )
          await setDoc(docRef, { category: updatedCategories }, { merge: true })
          setCategories(updatedCategories)
          toast.success("Category deleted successfully")
        }
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error(`Failed to delete ${itemToDelete.type}`)
    } finally {
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const resetForm = () => {
    setProductName("")
    setProductBrand("")
    setProductCategory("")
    setOilTypes([{ name: "", price: "", offer: "" }])
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedBrandFilter("all")
    setSelectedCategoryFilter("all")
  }

  const hasActiveFilters = searchQuery || selectedBrandFilter !== "all" || selectedCategoryFilter !== "all"

  // Get lowest price from types
  const getLowestPrice = (types: OilType[]) => {
    if (types.length === 0) return null
    const prices = types.map(t => parseFloat(t.price)).filter(p => !isNaN(p))
    if (prices.length === 0) return null
    return Math.min(...prices)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-10">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your oil products, brands, and categories
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="brands" className="gap-2">
                <Building2 className="h-4 w-4" />
                Brands
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Categories
              </TabsTrigger>
            </TabsList>

            {activeTab === "products" && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <PackagePlus className="h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={clearFilters}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear filters</TooltipContent>
                  </Tooltip>
                )}

                <div className="flex border rounded-lg">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className="rounded-r-none"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className="rounded-l-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            )}

            {/* Products Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">
                  {hasActiveFilters ? "No products match your filters" : "No products yet"}
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "Add your first product to get started"
                  }
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const lowestPrice = getLowestPrice(product.types)
                  const hasOffer = product.types.some(t => t.offer)

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${encodeURIComponent(product.id)}`}
                      className="group"
                    >
                      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 h-full">
                        <div className="aspect-square w-full overflow-hidden bg-muted relative">
                          {product.mainImage ? (
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-16 w-16 text-muted-foreground/30" />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {hasOffer && (
                              <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                Offer
                              </Badge>
                            )}
                          </div>

                          {/* Variants count */}
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="secondary" className="bg-black/60 text-white border-0 text-xs">
                              <Layers className="h-3 w-3 mr-1" />
                              {product.types.length} variant{product.types.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-2">
                          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{product.brand || "No brand"}</span>
                          </div>

                          {lowestPrice && (
                            <div className="flex items-center gap-1 text-sm font-medium text-primary">
                              <IndianRupee className="h-3.5 w-3.5" />
                              <span>From {lowestPrice.toLocaleString()}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const lowestPrice = getLowestPrice(product.types)
                  const hasOffer = product.types.some(t => t.offer)

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${encodeURIComponent(product.id)}`}
                      className="group"
                    >
                      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50">
                        <div className="flex items-center gap-4 p-4">
                          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {product.mainImage ? (
                              <img
                                src={product.mainImage}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                  {product.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {product.brand || "No brand"}
                                  </span>
                                  {product.category && (
                                    <span className="flex items-center gap-1">
                                      <FolderOpen className="h-3 w-3" />
                                      {product.category}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    {product.types.length} variant{product.types.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                {hasOffer && (
                                  <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                    Offer
                                  </Badge>
                                )}
                                {lowestPrice && (
                                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                    <IndianRupee className="h-3.5 w-3.5" />
                                    <span>From {lowestPrice.toLocaleString()}</span>
                                  </div>
                                )}
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="new-brand" className="text-base font-medium">Add New Brand</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Brands help organize your products
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Input
                        id="new-brand"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Enter brand name..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
                        className="max-w-sm"
                      />
                      <Button onClick={handleAddBrand} disabled={isAddingBrand}>
                        {isAddingBrand ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {brands.length > 0 ? (
                    <div>
                      <Label className="text-base font-medium">Existing Brands ({brands.length})</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                        {brands.map((brand) => {
                          const productCount = products.filter(p => p.brand === brand).length
                          return (
                            <div
                              key={brand}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Building2 className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{brand}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {productCount} product{productCount !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete('brand', brand)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground">No brands added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="new-category" className="text-base font-medium">Add New Category</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Categories help customers find products
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Input
                        id="new-category"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        className="max-w-sm"
                      />
                      <Button onClick={handleAddCategory} disabled={isAddingCategory}>
                        {isAddingCategory ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {categories.length > 0 ? (
                    <div>
                      <Label className="text-base font-medium">Existing Categories ({categories.length})</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                        {categories.map((category) => {
                          const productCount = products.filter(p => p.category === category).length
                          return (
                            <div
                              key={category}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                  <FolderOpen className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{category}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {productCount} product{productCount !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete('category', category)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground">No categories added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            {/* Header */}
            <div className="px-6 py-5 border-b bg-muted/30">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Add New Product
                </DialogTitle>
                <DialogDescription>
                  Fill in the product details and add pricing variants
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-8">
                {/* Section 1: Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      1
                    </div>
                    Basic Information
                  </div>

                  <div className="pl-8 space-y-4">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="product-name" className="text-sm font-medium">
                        Product Name <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="product-name"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Enter product name..."
                          className="pl-10 h-11"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will be the unique identifier for the product
                      </p>
                    </div>

                    {/* Brand and Category Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Brand</Label>
                        <Select value={productBrand} onValueChange={setProductBrand}>
                          <SelectTrigger className="h-11">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select brand" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {brands.length === 0 ? (
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                No brands available. Add brands from the Brands tab.
                              </div>
                            ) : (
                              brands.map((brandName) => (
                                <SelectItem key={brandName} value={brandName}>
                                  {brandName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Category</Label>
                        <Select value={productCategory} onValueChange={setProductCategory}>
                          <SelectTrigger className="h-11">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select category" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length === 0 ? (
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                No categories available. Add categories from the Categories tab.
                              </div>
                            ) : (
                              categories.map((categoryName) => (
                                <SelectItem key={categoryName} value={categoryName}>
                                  {categoryName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* Section 2: Pricing Variants */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        2
                      </div>
                      Pricing Variants
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddType}
                      className="gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Add Variant
                    </Button>
                  </div>

                  <div className="pl-8 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Add different packaging sizes and their prices. At least one variant is required.
                    </p>

                    {oilTypes.map((type, index) => (
                      <div
                        key={index}
                        className="relative p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors group"
                      >
                        {/* Variant Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-normal">
                              Variant {index + 1}
                            </Badge>
                            {type.offer && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                Has Offer
                              </Badge>
                            )}
                          </div>
                          {oilTypes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveType(index)}
                              className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* Variant Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor={`type-name-${index}`} className="text-xs font-medium text-muted-foreground">
                              SIZE / PACKAGING <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`type-name-${index}`}
                              value={type.name}
                              onChange={(e) => handleTypeChange(index, "name", e.target.value)}
                              placeholder="e.g., 15 KG Tin"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`type-price-${index}`} className="text-xs font-medium text-muted-foreground">
                              PRICE (₹) <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`type-price-${index}`}
                                value={type.price}
                                onChange={(e) => handleTypeChange(index, "price", e.target.value)}
                                placeholder="2750"
                                type="number"
                                className="h-10 pl-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`type-offer-${index}`} className="text-xs font-medium text-muted-foreground">
                              OFFER TAG
                            </Label>
                            <Input
                              id={`type-offer-${index}`}
                              value={type.offer || ""}
                              onChange={(e) => handleTypeChange(index, "offer", e.target.value)}
                              placeholder="e.g., 10% Off"
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add more prompt */}
                    {oilTypes.length === 1 && (
                      <button
                        type="button"
                        onClick={handleAddType}
                        className="w-full p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add another variant</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {productName && (
                  <span>
                    Creating: <span className="font-medium text-foreground">{productName}</span>
                    {oilTypes.filter(t => t.name && t.price).length > 0 && (
                      <span> with {oilTypes.filter(t => t.name && t.price).length} variant(s)</span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  disabled={isSubmitting || !productName.trim()}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {itemToDelete?.type === 'brand' ? 'Brand' : 'Category'}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{itemToDelete?.name}&quot;?
                This action cannot be undone.
                {itemToDelete && (
                  <span className="block mt-2 text-amber-600">
                    Note: Products using this {itemToDelete.type} will not be affected.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirmed}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
