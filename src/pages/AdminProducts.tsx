import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { productsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Search, Package, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminProducts = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'SENSUS PERFUME',
    description: '',
    shortDescription: '',
    category: 'men',
    image: '',
    concentration: 'Eau de Parfum',
    stock: 100,
    featured: false,
    new: false,
    bestseller: false,
    discountPercent: 0,
    variants: [{ size: '30ml', price: 95 }],
    fragranceNotes: [
      { type: 'top', notes: [] },
      { type: 'heart', notes: [] },
      { type: 'base', notes: [] }
    ]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [multipleImages, setMultipleImages] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);

  const fragranceNoteSuggestions = {
    top: ['Bergamot', 'Citrus', 'Grapefruit', 'Lemon', 'Orange', 'Green Apple', 'Mint', 'Lavender', 'Cardamom', 'Black Pepper'],
    heart: ['Floral', 'Rose', 'Jasmine', 'Lavender', 'Geranium', 'Spicy', 'Woody', 'Cedar', 'Tobacco', 'Saffron'],
    base: ['Musk', 'Amber', 'Vanilla', 'Sandalwood', 'Oud', 'Cedarwood', 'Patchouli', 'Leather', 'Benzoin', 'Tonka Bean']
  } as const;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMultipleImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setMultipleImages((prev) => prev.filter((_, i) => i !== index));
    if (coverImageIndex === index) {
      setCoverImageIndex(0);
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await productsAPI.getAll();
      // Handle both new paginated and old response formats
      const products = Array.isArray(response) 
        ? response 
        : (response?.data || []);
      setProducts(products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Unable to load products. Please refresh the page.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Use useMemo for better performance - only recalculate when dependencies change
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    return filtered;
  }, [products, searchTerm, categoryFilter]);

  const getPriceRange = (product: any) => {
    const prices = (product?.variants || [])
      .map((variant: any) => Number(variant?.price) || 0)
      .filter((price: number) => price > 0);

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const discountPercent = Number(product?.discountPercent || 0);
    const hasDiscount = discountPercent > 0;
    const discountedMin = hasDiscount ? min - (min * discountPercent / 100) : min;
    const discountedMax = hasDiscount ? max - (max * discountPercent / 100) : max;

    return {
      min,
      max,
      discountedMin,
      discountedMax,
      discountPercent,
      hasDiscount
    };
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
    setMultipleImages([]);
    setCoverImageIndex(0);
    setFormData({
      name: '',
      brand: 'SENSUS PERFUME',
      description: '',
      shortDescription: '',
      category: 'men',
      image: '/perfume-men.jpg',
      concentration: 'Eau de Parfum',
      stock: 100,
      featured: false,
      new: false,
      bestseller: false,
      discountPercent: 0,
      variants: [{ size: '30ml', price: 95 }],
      fragranceNotes: [
        { type: 'top', notes: [] },
        { type: 'heart', notes: [] },
        { type: 'base', notes: [] }
      ]
    });
    setFormDialogOpen(true);
  };

  const openEditDialog = async (product: any) => {
    try {
      console.log('Opening edit dialog for product:', { _id: product._id, name: product.name });
      
      // Fetch full product details instead of using the limited list data
      const fullProduct = await productsAPI.getById(product._id || product.id);
      console.log('Fetched full product details:', {
        _id: fullProduct._id,
        name: fullProduct.name,
        brand: fullProduct.brand,
        description: fullProduct.description ? 'Present' : 'MISSING',
        shortDescription: fullProduct.shortDescription ? 'Present' : 'MISSING',
        category: fullProduct.category,
        stock: fullProduct.stock,
        variants: fullProduct.variants ? `${fullProduct.variants.length} variants` : 'MISSING',
        image: fullProduct.image ? 'Present' : 'MISSING',
        images: fullProduct.images ? `${fullProduct.images.length} images` : 'MISSING'
      });
      
      const newFormData = {
        name: fullProduct.name || '',
        brand: fullProduct.brand || '',
        description: fullProduct.description || '',
        shortDescription: fullProduct.shortDescription || '',
        category: fullProduct.category || '',
        image: fullProduct.image || '',
        concentration: fullProduct.concentration || '',
        stock: fullProduct.stock || 100,
        featured: fullProduct.featured || false,
        new: fullProduct.new || false,
        bestseller: fullProduct.bestseller || false,
        discountPercent: fullProduct.discountPercent || 0,
        variants: fullProduct.variants || [],
        fragranceNotes: fullProduct.fragranceNotes || [
          { type: 'top', notes: [] },
          { type: 'heart', notes: [] },
          { type: 'base', notes: [] }
        ]
      };

      console.log('Setting form data:', newFormData);
      
      setEditingProduct(fullProduct);
      setImageFile(null);
      setImagePreview(fullProduct.image || '');
      setMultipleImages(fullProduct.images || [fullProduct.image]);
      setCoverImageIndex(0);
      setFormData(newFormData);
      setFormDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to fetch product details:', error);
      toast.error('Unable to load product details. Please try again.');
    }
  };

  const handleSaveProduct = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.brand || !formData.description) {
        toast.error('Please fill in all required fields (Name, Brand, Description)');
        return;
      }

      // Use multiple images if provided, otherwise use single image
      const images = multipleImages.length > 0 ? multipleImages : [imagePreview || formData.image];
      const coverImage = images[coverImageIndex] || images[0];

      const productData = {
        ...formData,
        image: coverImage, // Main/cover image
        images: images // All images for carousel
      };

      console.log('Saving product:', { 
        isEditing: !!editingProduct, 
        productId: editingProduct?._id,
        data: productData 
      });

      if (editingProduct) {
        console.log('Updating existing product with ID:', editingProduct._id);
        const response = await productsAPI.update(editingProduct._id, productData);
        console.log('Update response:', response);
        toast.success('Product updated successfully');
      } else {
        console.log('Creating new product');
        const response = await productsAPI.create(productData);
        console.log('Create response:', response);
        toast.success('Product created successfully');
      }
      
      setFormDialogOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      toast.error(`Unable to ${editingProduct ? 'update' : 'create'} product. Please try again.`);
    }
  };

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await productsAPI.delete(productToDelete);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error('Unable to delete product. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  if (loading || loadingProducts) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-lg">Loading products...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="bg-white p-4 md:p-8 space-y-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Products</h2>
            <p className="text-slate-600 mt-2 text-sm md:text-base">Manage your perfume collection and inventory</p>
          </div>
          <Button 
            onClick={openAddDialog}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm rounded-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 md:p-6 border border-purple-100 shadow-sm bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold text-slate-900 mb-2 block">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or brand"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-900 mb-2 block">Filter by Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg bg-white text-slate-900 [&>span]:text-slate-900">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm font-bold text-purple-600 bg-purple-50 px-4 py-2.5 rounded-lg border border-purple-200 w-full text-center">
                {filteredProducts.length} products
              </div>
            </div>
          </div>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center border border-purple-100 shadow-sm bg-white">
            <Package className="w-16 h-16 mx-auto text-purple-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-600">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by adding your first product'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const pricing = getPriceRange(product);

              return (
                <Card key={product._id} className="group relative overflow-hidden border border-purple-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-2xl bg-white">
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 relative">
                  <img 
                    src={product.image || '/placeholder.jpg'} 
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                  />
                  {product.featured && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Featured
                    </div>
                  )}
                  {product.bestseller && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Bestseller
                    </div>
                  )}
                  {product.new && (
                    <div className="absolute top-12 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      New
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 bg-purple-50 px-2 py-1 rounded inline-block">
                      {product.category}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-purple-600 font-medium mb-2">{product.brand}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {product.shortDescription || product.description}
                    </p>
                  </div>
                  <div className="space-y-3 mb-4 pb-4 border-t border-purple-100">
                    <div className="pt-3 flex items-center justify-between">
                      <span className="text-sm text-slate-600">Price Range</span>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">
                          PKR {pricing.discountedMin} - PKR {pricing.discountedMax}
                        </div>
                        {pricing.hasDiscount && (
                          <div className="text-xs text-slate-500">
                            <span className="line-through">PKR {pricing.min} - PKR {pricing.max}</span>
                            <span className="ml-2 text-emerald-600 font-semibold">-{pricing.discountPercent}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Stock</span>
                      <span className={`font-semibold px-3 py-1 rounded-full text-sm ${product.stock > 20 ? 'bg-emerald-100 text-emerald-700' : product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEditDialog(product)}
                      className="flex-1 bg-purple-100 text-purple-600 hover:bg-purple-200 font-semibold rounded-lg"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => confirmDelete(product._id)}
                      className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 font-semibold rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Product Form Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-50 to-white text-slate-900 rounded-2xl shadow-2xl">
            <DialogHeader className="border-b border-purple-100 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-emerald-500 bg-clip-text text-transparent">
                    {editingProduct ? 'Update Product Details' : 'Create New Product'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 mt-1">
                    {editingProduct ? 'Modify and enhance your perfume listing' : 'Add a new premium perfume to your collection'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              {/* Basic Info Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      Product Name
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Alba, Signature"
                      className="bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-bold text-slate-700">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="e.g. SENSUS PERFUME"
                      className="bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Descriptions
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription" className="text-sm font-bold text-slate-700">Short Description</Label>
                    <Input
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                      placeholder="One-line summary of the perfume"
                      className="bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      Full Description
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      placeholder="Detailed description including notes, origin, and special characteristics..."
                      className="bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product Properties Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Product Properties
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      Category
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="bg-white text-slate-900 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 [&>span]:text-slate-900 font-medium rounded-lg transition-all">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-slate-900 rounded-lg">
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="concentration" className="text-sm font-bold text-slate-700">Concentration</Label>
                    <Select value={formData.concentration} onValueChange={(value) => setFormData({...formData, concentration: value})}>
                      <SelectTrigger className="bg-white text-slate-900 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 [&>span]:text-slate-900 font-medium rounded-lg transition-all">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-slate-900 rounded-lg">
                        <SelectItem value="Eau de Parfum">Eau de Parfum</SelectItem>
                        <SelectItem value="Extrait de Parfum">Extrait de Parfum</SelectItem>
                        <SelectItem value="Eau de Toilette">Eau de Toilette</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-bold text-slate-700">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      className="bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-sm font-bold text-slate-700">Discount %</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({...formData, discountPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})}
                      placeholder="0"
                      className="bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                    />
                    <p className="text-xs text-slate-500">Enter 0 for no discount, max 100%</p>
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Product Images (Gallery)
                </h3>
                
                {/* Multiple Images Upload */}
                <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-all duration-300 bg-gradient-to-b from-purple-50 to-transparent mb-4">
                  <input
                    type="file"
                    id="multiple-images-upload"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImagesChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="multiple-images-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Package className="w-8 h-8 text-purple-600" />
                    </div>
                    <span className="text-base text-slate-800 mb-1 font-semibold">Click to upload multiple images</span>
                    <span className="text-xs text-slate-500">Select multiple images for gallery • PNG, JPG up to 5MB each</span>
                  </label>
                </div>

                {/* Images Gallery */}
                {multipleImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Gallery Preview ({multipleImages.length} images)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {multipleImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className={`relative rounded-lg overflow-hidden border-4 transition-all ${coverImageIndex === index ? 'border-emerald-400 shadow-lg' : 'border-purple-200'}`}>
                            <img 
                              src={image} 
                              alt={`Preview ${index + 1}`}
                              className="w-full aspect-square object-cover"
                            />
                            {coverImageIndex === index && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="bg-emerald-400 text-slate-900 px-2 py-1 rounded text-xs font-bold">COVER</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
                            {coverImageIndex !== index && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setCoverImageIndex(index)}
                                className="bg-emerald-400 text-slate-900 hover:bg-emerald-500 font-bold rounded-full w-8 h-8 p-0"
                                title="Set as cover"
                              >
                                ★
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-full w-8 h-8 p-0"
                              title="Remove"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 italic">Click ★ to set as cover image, × to remove</p>
                  </div>
                )}

                {/* Fallback: Single Image Upload */}
                {multipleImages.length === 0 && (
                  <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-emerald-400 transition-all duration-300 bg-gradient-to-b from-purple-50 to-transparent">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-40 h-40 object-cover mx-auto rounded-lg shadow-lg border-4 border-purple-100"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                            setFormData({...formData, image: '/perfume-men.jpg'});
                          }}
                          className="bg-red-500 text-white hover:bg-red-600 font-semibold rounded-lg transition-all"
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer inline-flex flex-col items-center"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Package className="w-8 h-8 text-purple-600" />
                          </div>
                          <span className="text-base text-slate-800 mb-1 font-semibold">Click to upload single image</span>
                          <span className="text-xs text-slate-500">PNG, JPG up to 5MB • Recommended: 500x500px</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-700 font-semibold">Or select a preset:</p>
                  <Select 
                    value={formData.image} 
                    onValueChange={(value) => {
                      setFormData({...formData, image: value});
                      setImagePreview('');
                      setImageFile(null);
                      if (multipleImages.length === 0) {
                        setMultipleImages([value]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white text-slate-900 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 [&>span]:text-slate-900 font-medium rounded-lg transition-all">
                      <SelectValue placeholder="Select preset image" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-slate-900 rounded-lg">
                      <SelectItem value="/perfume-men.jpg">Men's Perfume</SelectItem>
                      <SelectItem value="/perfume-women.jpg">Women's Perfume</SelectItem>
                      <SelectItem value="/perfume-unisex.jpg">Unisex Perfume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Variants Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Variants (Size & Price)
                </h3>
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-lg border border-purple-100">
                      <Input
                        placeholder="e.g. 30ml, 50ml"
                        value={variant.size}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].size = e.target.value;
                          setFormData({...formData, variants: newVariants});
                        }}
                        className="flex-1 bg-white text-slate-900 placeholder:text-slate-600 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Price (PKR)"
                          value={variant.price}
                          onChange={(e) => {
                            const newVariants = [...formData.variants];
                            newVariants[index].price = parseFloat(e.target.value) || 0;
                            setFormData({...formData, variants: newVariants});
                          }}
                          className="flex-1 bg-white text-slate-900 placeholder:text-slate-600 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                        />
                        {formData.variants.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => {
                              const newVariants = formData.variants.filter((_, i) => i !== index);
                              setFormData({...formData, variants: newVariants});
                            }}
                            className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-lg transition-all shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setFormData({...formData, variants: [...formData.variants, { size: '', price: 0 }]})}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-semibold rounded-lg transition-all py-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              </div>

              {/* Fragrance Notes Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Fragrance Notes
                </h3>
                <div className="space-y-4">
                  {/* Top Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-purple-600">TOP NOTES</span>
                      <span className="text-xs font-normal text-slate-500">(Opening scents)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter note (e.g. Bergamot)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            e.preventDefault();
                            const note = e.currentTarget.value.trim();
                            const newNotes = [...formData.fragranceNotes];
                            const topNotes = newNotes.find(n => n.type === 'top');
                            if (topNotes && !topNotes.notes.includes(note)) {
                              topNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const note = input.value.trim();
                            const newNotes = [...formData.fragranceNotes];
                            const topNotes = newNotes.find(n => n.type === 'top');
                            if (topNotes && !topNotes.notes.includes(note)) {
                              topNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                              input.value = '';
                            }
                          }
                        }}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-semibold rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fragranceNoteSuggestions.top.map((note) => (
                        <Button
                          key={note}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newNotes = [...formData.fragranceNotes];
                            const topNotes = newNotes.find(n => n.type === 'top');
                            if (topNotes && !topNotes.notes.includes(note)) {
                              topNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                            }
                          }}
                          className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          {note}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.fragranceNotes.find(n => n.type === 'top')?.notes.map((note, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                          {note}
                          <button
                            type="button"
                            onClick={() => {
                              const newNotes = [...formData.fragranceNotes];
                              const topNotes = newNotes.find(n => n.type === 'top');
                              if (topNotes) {
                                topNotes.notes = topNotes.notes.filter((_, i) => i !== idx);
                                setFormData({...formData, fragranceNotes: newNotes});
                              }
                            }}
                            className="hover:text-purple-900 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Heart Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-pink-600">HEART NOTES</span>
                      <span className="text-xs font-normal text-slate-500">(Middle scents)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter note (e.g. Floral)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            e.preventDefault();
                            const note = e.currentTarget.value.trim();
                            const newNotes = [...formData.fragranceNotes];
                            const heartNotes = newNotes.find(n => n.type === 'heart');
                            if (heartNotes && !heartNotes.notes.includes(note)) {
                              heartNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const note = input.value.trim();
                            const newNotes = [...formData.fragranceNotes];
                            const heartNotes = newNotes.find(n => n.type === 'heart');
                            if (heartNotes && !heartNotes.notes.includes(note)) {
                              heartNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                              input.value = '';
                            }
                          }
                        }}
                        className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 font-semibold rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fragranceNoteSuggestions.heart.map((note) => (
                        <Button
                          key={note}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newNotes = [...formData.fragranceNotes];
                            const heartNotes = newNotes.find(n => n.type === 'heart');
                            if (heartNotes && !heartNotes.notes.includes(note)) {
                              heartNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                            }
                          }}
                          className="text-xs border-pink-200 text-pink-700 hover:bg-pink-50"
                        >
                          {note}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.fragranceNotes.find(n => n.type === 'heart')?.notes.map((note, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                          {note}
                          <button
                            type="button"
                            onClick={() => {
                              const newNotes = [...formData.fragranceNotes];
                              const heartNotes = newNotes.find(n => n.type === 'heart');
                              if (heartNotes) {
                                heartNotes.notes = heartNotes.notes.filter((_, i) => i !== idx);
                                setFormData({...formData, fragranceNotes: newNotes});
                              }
                            }}
                            className="hover:text-pink-900 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Base Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-amber-600">BASE NOTES</span>
                      <span className="text-xs font-normal text-slate-500">(Lasting scents)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter note (e.g. Musk)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            e.preventDefault();
                            const note = e.currentTarget.value.trim();
                            const newNotes = [...formData.fragranceNotes];
                            const baseNotes = newNotes.find(n => n.type === 'base');
                            if (baseNotes && !baseNotes.notes.includes(note)) {
                              baseNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 border border-purple-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-lg transition-all font-medium"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const note = input.value.trim();
                            const newNotes = [...formData.fragranceNotes];
                            const baseNotes = newNotes.find(n => n.type === 'base');
                            if (baseNotes && !baseNotes.notes.includes(note)) {
                              baseNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                              input.value = '';
                            }
                          }
                        }}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 font-semibold rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fragranceNoteSuggestions.base.map((note) => (
                        <Button
                          key={note}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newNotes = [...formData.fragranceNotes];
                            const baseNotes = newNotes.find(n => n.type === 'base');
                            if (baseNotes && !baseNotes.notes.includes(note)) {
                              baseNotes.notes.push(note);
                              setFormData({...formData, fragranceNotes: newNotes});
                            }
                          }}
                          className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                        >
                          {note}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.fragranceNotes.find(n => n.type === 'base')?.notes.map((note, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                          {note}
                          <button
                            type="button"
                            onClick={() => {
                              const newNotes = [...formData.fragranceNotes];
                              const baseNotes = newNotes.find(n => n.type === 'base');
                              if (baseNotes) {
                                baseNotes.notes = baseNotes.notes.filter((_, i) => i !== idx);
                                setFormData({...formData, fragranceNotes: newNotes});
                              }
                            }}
                            className="hover:text-amber-900 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">Press Enter or click + to add notes. Click × to remove.</p>
                </div>
              </div>

              {/* Flags Section */}
              <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded"></div>
                  Product Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-all">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      className="w-5 h-5 rounded accent-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">Featured</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-all">
                    <input
                      type="checkbox"
                      checked={formData.new}
                      onChange={(e) => setFormData({...formData, new: e.target.checked})}
                      className="w-5 h-5 rounded accent-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">New</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-transparent rounded-lg border border-pink-200 cursor-pointer hover:border-pink-400 transition-all">
                    <input
                      type="checkbox"
                      checked={formData.bestseller}
                      onChange={(e) => setFormData({...formData, bestseller: e.target.checked})}
                      className="w-5 h-5 rounded accent-pink-500"
                    />
                    <span className="font-semibold text-slate-800">Bestseller</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-purple-100 pt-4 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="w-full sm:w-auto bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-semibold rounded-lg transition-all order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProduct}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 hover:from-emerald-600 hover:to-emerald-700 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl order-1 sm:order-2"
                disabled={!formData.name || !formData.description}
              >
                <Package className="w-4 h-4 mr-2" />
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
