"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, setDoc, doc, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Loader2, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OilType {
  name: string
  price: string
  offer?: string
}

interface OilProduct {
  id: string
  name: string
  brand: string
  types: OilType[]
  mainImage?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<OilProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddBrandDialogOpen, setIsAddBrandDialogOpen] = useState(false)
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Form state
  const [productName, setProductName] = useState("")
  const [brand, setBrand] = useState("")
  const [oilTypes, setOilTypes] = useState<OilType[]>([{ name: "", price: "", offer: "" }])
  const [newBrandName, setNewBrandName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")

  useEffect(() => {
    fetchProducts()
    fetchBrands()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, "rajaoil"), where("docType", "==", "product"))
      const querySnapshot = await getDocs(q)
      const productsData: OilProduct[] = []
      querySnapshot.forEach((docSnapshot) => {
        productsData.push({
          id: docSnapshot.id,
          name: docSnapshot.id,
          brand: docSnapshot.data().brand || "",
          types: docSnapshot.data().types || [],
          mainImage: docSnapshot.data().mainImage || "",
        })
      })
      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBrands = async () => {
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
  }

  const fetchCategories = async () => {
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
  }

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

  const handleAdd = async () => {
    if (!productName.trim()) {
      alert("Please enter a product name")
      return
    }

    try {
      // Use setDoc with custom document ID (product name)
      await setDoc(doc(db, "rajaoil", productName), {
        docType: "product",
        brand,
        types: oilTypes.filter(type => type.name && type.price),
      })
      setIsAddDialogOpen(false)
      setProductName("")
      setBrand("")
      setOilTypes([{ name: "", price: "" }])
      fetchProducts()
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Error adding product. The product name might already exist.")
    }
  }


  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      alert("Please enter a brand name")
      return
    }

    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      let updatedBrands = []
      if (docSnap.exists()) {
        updatedBrands = [...(docSnap.data().brands || []), newBrandName]
      } else {
        updatedBrands = [newBrandName]
      }

      await setDoc(docRef, { brands: updatedBrands }, { merge: true })
      setBrands(updatedBrands)
      setNewBrandName("")
      alert("Brand added successfully!")
    } catch (error) {
      console.error("Error adding brand:", error)
      alert("Failed to add brand")
    }
  }

  const handleDeleteBrand = async (brandToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${brandToDelete}"?`)) {
      return
    }

    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const updatedBrands = (docSnap.data().brands || []).filter(
          (brand: string) => brand !== brandToDelete
        )
        await setDoc(docRef, { brands: updatedBrands }, { merge: true })
        setBrands(updatedBrands)
        alert("Brand deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting brand:", error)
      alert("Failed to delete brand")
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name")
      return
    }

    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      let updatedCategories = []
      if (docSnap.exists()) {
        updatedCategories = [...(docSnap.data().category || []), newCategoryName]
      } else {
        updatedCategories = [newCategoryName]
      }

      await setDoc(docRef, { category: updatedCategories }, { merge: true })
      setCategories(updatedCategories)
      setNewCategoryName("")
      alert("Category added successfully!")
    } catch (error) {
      console.error("Error adding category:", error)
      alert("Failed to add category")
    }
  }

  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryToDelete}"?`)) {
      return
    }

    try {
      const docRef = doc(db, "rajaoil", "others")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const updatedCategories = (docSnap.data().category || []).filter(
          (category: string) => category !== categoryToDelete
        )
        await setDoc(docRef, { category: updatedCategories }, { merge: true })
        setCategories(updatedCategories)
        alert("Category deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Failed to delete category")
    }
  }

  const resetForm = () => {
    setProductName("")
    setBrand("")
    setOilTypes([{ name: "", price: "", offer: "" }])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raja Oil Products</h2>
          <p className="text-muted-foreground">
            Manage your oil products and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>
                  Add new categories or delete existing ones
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Add New Category</Label>
                  <div className="flex gap-2">
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Cooking Oil"
                    />
                    <Button onClick={handleAddCategory}>Add</Button>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Categories</Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                      {categories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <span className="text-sm">{category}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddBrandDialogOpen} onOpenChange={setIsAddBrandDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Brands</DialogTitle>
                <DialogDescription>
                  Add new brands or delete existing ones
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Add New Brand</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand-name"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="e.g., TSRG MITHRA BRAND"
                    />
                    <Button onClick={handleAddBrand}>Add</Button>
                  </div>
                </div>

                {brands.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Brands</Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                      {brands.map((brand) => (
                        <div
                          key={brand}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <span className="text-sm">{brand}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBrand(brand)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddBrandDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new oil product to Raja Oil collection
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., CHEKKU GROUNDNUT OIL"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used as the product identifier
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand Name</Label>
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
                <div className="flex items-center justify-between">
                  <Label>Oil Types</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddType}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Packaging Type
                  </Button>
                </div>
                {oilTypes.map((type, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-md">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`type-name-${index}`}>Name</Label>
                        <Input
                          id={`type-name-${index}`}
                          value={type.name}
                          onChange={(e) => handleTypeChange(index, "name", e.target.value)}
                          placeholder="e.g., 15 KG Tin"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`type-price-${index}`}>Price</Label>
                        <Input
                          id={`type-price-${index}`}
                          value={type.price}
                          onChange={(e) => handleTypeChange(index, "price", e.target.value)}
                          placeholder="e.g., 2750"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`type-offer-${index}`}>Offer (Optional)</Label>
                        <Input
                          id={`type-offer-${index}`}
                          value={type.offer || ""}
                          onChange={(e) => handleTypeChange(index, "offer", e.target.value)}
                          placeholder="e.g., Festival Offer, Limited Stock"
                        />
                      </div>
                      {oilTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveType(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                No products found. Add your first product to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${encodeURIComponent(product.id)}`}
                className="group"
              >
                <Card className="overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer border-gray-200">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50">
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2 text-gray-900 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      <span className="font-medium text-gray-700">Brand: </span>
                      {product.brand}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
