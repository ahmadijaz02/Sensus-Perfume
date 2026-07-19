import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ProductCard from '@/components/products/ProductCard';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types/product';

const Shop = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [category, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll(true);
      // Handle both new paginated and old response formats
      const products = Array.isArray(response) 
        ? response 
        : (response?.data || []);
      setProducts(products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const categoryNames: Record<string, string> = {
    men: 'For Him',
    women: 'For Her',
    unisex: 'Unisex',
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.fragranceNotes && product.fragranceNotes.some(noteGroup => 
          noteGroup.notes.some(note => note.toLowerCase().includes(query))
        ))
      );
    }
    
    return filtered;
  }, [products, category, searchQuery]);

  const unisexProducts = useMemo(() => {
    return products.filter(p => p.category === 'unisex');
  }, [products]);

  const isGenderedCategory = category === 'men' || category === 'women';
  const shouldFallbackToUnisex = !searchQuery && isGenderedCategory && filteredProducts.length === 0 && unisexProducts.length > 0;
  const displayProducts = shouldFallbackToUnisex ? unisexProducts : filteredProducts;

  const getPageTitle = () => {
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }
    return category ? categoryNames[category] || 'Shop' : 'All Fragrances';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-lg">Loading products...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      
      <main className="container mx-auto px-4 pt-36 md:pt-40 lg:pt-44 pb-12 md:pb-16">
        <div className="mb-8 md:mb-12">
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl mb-4 md:mb-6 break-words animate-slide-up">{getPageTitle()}</h1>
          <p className="text-muted-foreground text-sm md:text-base animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
            {searchQuery 
              ? `Found ${filteredProducts.length} ${filteredProducts.length === 1 ? 'fragrance' : 'fragrances'}`
              : shouldFallbackToUnisex
                ? `Currently showing our Unisex collection (${displayProducts.length} ${displayProducts.length === 1 ? 'fragrance' : 'fragrances'})`
                : 'Discover our curated collection of luxury fragrances'
            }
          </p>
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              {searchQuery ? 'No fragrances found matching your search' : 'No fragrances available in this category'}
            </p>
            <p className="text-muted-foreground">
              Try adjusting your search or browse our other categories
            </p>
            {!searchQuery && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link className="px-6 py-3 text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition" to="/shop/unisex">
                  View Unisex
                </Link>
                <Link className="px-6 py-3 text-sm uppercase tracking-widest border border-primary/40 hover:border-primary transition" to="/shop">
                  View All
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map((product, index) => (
              <div 
                key={product._id || product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
