import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ChevronLeft, Star, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { productsAPI, reviewsAPI, settingsAPI } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewsList from '@/components/reviews/ReviewsList';
import { Product } from '@/types/product';
import { StoreSettings } from '@/types/settings';
import { toast } from 'sonner';
import pixel from '@/lib/pixel';

const ProductDetail = () => {
  const { id } = useParams(); // This can now be either slug or ID
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching product with ID:', id);
      
      // Fetch product details - this includes category for finding related products
      const productData = await productsAPI.getById(id!);
      console.log('✅ Product data received:', productData);
      setProduct(productData);
      
      // Fetch all products only if needed for related products
      // But use a lightweight query without full descriptions
      const allProductsResponse = await productsAPI.getAll(false);
      const allProducts = Array.isArray(allProductsResponse) 
        ? allProductsResponse 
        : (allProductsResponse?.data || []);
      
      // Find related products from the same category
      const related = allProducts
        .filter((p: Product) => p.category === productData.category && p._id !== productData._id)
        .slice(0, 3);
      setRelatedProducts(related);
      
      // Note: Review stats (averageRating, totalReviews) are now provided by the backend
      // No need to fetch reviews separately for the product info
    } catch (error) {
      console.error('❌ Failed to fetch product:', error);
      toast.error('Failed to load product. Please try again.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setSelectedVariant(0);
    setQuantity(1);
    setSelectedImage(0);
    setReviewRefresh((v) => v + 1);
    fetchProduct();
  }, [id, fetchProduct]);

  useEffect(() => {
    // Handle responsive items per view
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsAPI.get();
        setStoreSettings({
          globalDiscountPercent: Number(data.globalDiscountPercent ?? 0),
          promoCode: data.promoCode ?? '',
          promoDiscountPercent: Number(data.promoDiscountPercent ?? 0),
          deliveryCost: Number(data.deliveryCost ?? 0)
        });
      } catch (error) {
        // Fail silently to avoid blocking product view
      }
    };

    loadSettings();
  }, []);

  // Define variant early so it's available to all functions
  const variant = product?.variants?.[selectedVariant];

  // Calculate display price: global discount takes precedence over product discount
  const getDisplayPrice = () => {
    if (!variant?.price) return 0;
    
    let price = variant.price;
    
    // Global discount takes precedence
    if (storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0) {
      price = price - (price * storeSettings.globalDiscountPercent / 100);
    } else if (product?.discountPercent && product.discountPercent > 0) {
      // Apply product discount only if no global discount
      price = price - (price * product.discountPercent / 100);
    }
    
    return Math.round(price);
  };

  // Get discount percentage for display (global discount takes precedence)
  const getTotalDiscountPercent = () => {
    // Global discount takes precedence
    if (storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0) {
      return storeSettings.globalDiscountPercent;
    }
    // Otherwise show product discount
    return product?.discountPercent || 0;
  };

  useEffect(() => {
    if (!product) return;

    const productId = product._id || product.id;
    if (!productId) return;

    const price = getDisplayPrice();
    pixel.viewContent({
      content_ids: [String(productId)],
      content_name: product.name,
      content_type: 'product',
      value: price,
      currency: 'PKR'
    });
  }, [product, selectedVariant, storeSettings?.globalDiscountPercent]);

  // Reset carousel index when items per view changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [itemsPerView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-lg text-muted-foreground">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="font-display text-2xl mb-4 text-foreground">Product Not Found</h1>
            <Button variant="outline" asChild>
              <Link to="/shop">Return to Shop</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }
    try {
      const productId = product._id || product.id;
      if (!productId) {
        toast.error('Product information missing');
        return;
      }
      console.log('Adding to cart:', { productId, size: product.variants[selectedVariant].size, quantity });
      await addToCart(product, product.variants[selectedVariant], quantity);
      pixel.addToCart({
        content_ids: [String(productId)],
        content_name: product.name,
        content_type: 'product',
        value: getDisplayPrice() * quantity,
        currency: 'PKR'
      });
      // Toast is shown by CartContext
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast.error('Unable to add item to cart. Please try again.');
    }
  };

  const handleBuyNow = async () => {
    try {
      const productId = product._id || product.id;
      if (productId) {
        pixel.initiateCheckout({
          content_ids: [String(productId)],
          num_items: quantity,
          value: getDisplayPrice() * quantity,
          currency: 'PKR'
        });
      }
      // Pass checkout data directly through router state without storage
      const variantWithDiscount = {
        ...product.variants[selectedVariant],
        originalPrice: product.variants[selectedVariant].price,
        discountedPrice: getDisplayPrice(),
        discountPercent: getTotalDiscountPercent(),
        productDiscount: product?.discountPercent || 0,
        globalDiscount: storeSettings?.globalDiscountPercent || 0
      };
      
      navigate('/checkout', {
        state: {
          guestCheckoutItems: [
            {
              product,
              variant: variantWithDiscount,
              quantity
            }
          ]
        }
      });
    } catch (error: any) {
      console.error('Buy now error:', error);
      toast.error('Unable to process purchase. Please try again.');
    }
  };

  const maxIndex = Math.max(0, relatedProducts.length - itemsPerView);
  const canGoNext = carouselIndex < maxIndex;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      <CartDrawer />

      {/* Overlay to hide stray decorative particles on this page */}
      <div className="pointer-events-none absolute inset-0 bg-background/90" aria-hidden="true" />

      <main className="pt-20 md:pt-28 lg:pt-32 relative z-10">
        {/* Breadcrumb */}
        <div className="container mx-auto px-3 md:px-4 py-2.5 md:py-4 animate-slide-in-left">
          <Link 
            to="/shop" 
            className="inline-flex items-center text-xs md:text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 group"
          >
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-5 lg:gap-8">
            {/* Images */}
            <div className="space-y-1 max-w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-transparent overflow-hidden rounded-sm aspect-[3.5/4] flex items-center justify-center shadow-lg hover:shadow-[0_8px_30px_hsl(var(--primary)/0.2)] transition-all duration-500 relative">
                <img
                  src={product.images?.[selectedImage] || product.image || '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 bg-secondary overflow-hidden border-2 transition-all duration-300 rounded-sm hover:scale-110 hover:shadow-lg ${
                      selectedImage === idx ? 'border-primary scale-105' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="lg:py-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="mb-2 md:mb-2">
                <p className="text-xs md:text-sm text-muted-foreground tracking-[0.15em] uppercase mb-1.5">
                  {product.brand}
                </p>
                <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
                  <div className="flex-1">
                    <h1 className="font-display text-xl md:text-2xl lg:text-3xl">
                      {product.name}
                    </h1>
                  </div>
                  {product.averageRating && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-0.5 mb-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={
                              star <= Math.round(product.averageRating!)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-600">
                        {product.averageRating} • {product.totalReviews || 0} reviews
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{product.concentration}</p>
                
                {/* Badges */}
                <div className="flex gap-1.5 mt-1.5 md:mt-2">
                  {product.new && (
                    <span className="bg-primary text-primary-foreground px-2 md:px-3 py-1 text-[10px] md:text-xs tracking-[0.15em] uppercase">
                      New
                    </span>
                  )}
                  {product.bestseller && (
                    <span className="bg-foreground text-background px-2 md:px-3 py-1 text-[10px] md:text-xs tracking-[0.15em] uppercase">
                      Bestseller
                    </span>
                  )}
                </div>
              </div>

              {/* Price - Professional Display */}
              <div className="mb-3 md:mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {getTotalDiscountPercent() > 0 ? (
                    <>
                      {/* Discounted Price */}
                      <span className="font-display text-3xl md:text-4xl font-bold text-orange-600">
                        PKR {getDisplayPrice()}
                      </span>
                      {/* Original Price - Crossed Out */}
                      <span className="text-lg md:text-xl text-muted-foreground line-through">
                        PKR {variant?.price}
                      </span>
                      {/* Discount Badge */}
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs md:text-sm font-semibold ml-auto">
                        -{getTotalDiscountPercent()}%
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-3xl md:text-4xl font-bold">
                      PKR {variant?.price || 'N/A'}
                    </span>
                  )}
                </div>

                {/* Delivery Info */}
                {storeSettings?.deliveryCost !== undefined && storeSettings.deliveryCost > 0 && (
                  <div className="p-2.5 md:p-3 bg-blue-50 border border-blue-200 rounded text-xs md:text-sm text-blue-800 mt-3">
                    <span className="font-medium">Delivery Cost:</span> PKR {storeSettings.deliveryCost}
                  </div>
                )}
              </div>

              {/* Size Selector */}
              <div className="mb-1.5 md:mb-2">
                <p className="text-[10px] tracking-[0.15em] uppercase mb-1">Select Size</p>
                <div className="flex flex-wrap gap-1">
                  {product.variants?.map((v, idx) => (
                    <button
                      key={v.size}
                      onClick={() => setSelectedVariant(idx)}
                      className={`px-3.5 py-1.5 md:px-5 md:py-2 border text-xs md:text-sm tracking-wide transition-all ${
                        selectedVariant === idx
                          ? 'border-primary text-primary'
                          : 'border-border text-foreground hover:border-foreground'
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-1.5 md:mb-2">
                <p className="text-[10px] tracking-[0.15em] uppercase mb-1">Quantity</p>
                <div className="inline-flex items-center border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 md:p-3 hover:text-primary transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-11 md:w-14 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 md:p-3 hover:text-primary transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Add to Cart and Buy Now Buttons */}
              <div className="flex flex-col gap-2 md:gap-2.5 mb-1.5 md:mb-2">
                <Button 
                  variant="hero" 
                  size="lg"
                  className="w-full text-xs h-9"
                  onClick={handleBuyNow}
                >
                  BUY NOW — PKR {getDisplayPrice() * quantity}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full text-xs h-9"
                  onClick={handleAddToCart}
                >
                  ADD TO CART
                </Button>
              </div>

              {/* Description */}
              <div className="border-t border-border pt-3 md:pt-4 mb-3 md:mb-4">
                <h3 className="font-display text-base md:text-lg mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Fragrance Notes */}
              {product.fragranceNotes && product.fragranceNotes.length > 0 && (
              <div className="border-t border-border pt-3 md:pt-4">
                <h3 className="font-display text-base md:text-lg mb-3">Fragrance Notes</h3>
                <div className="space-y-2">
                  {product.fragranceNotes.map((note) => (
                    <div key={note.type} className="flex gap-4">
                      <div className="w-14 flex-shrink-0">
                        <span className="text-[9px] tracking-[0.15em] uppercase text-primary">
                          {note.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {note.notes.map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-3 md:py-4 bg-secondary">
            <div className="container mx-auto px-3 md:px-4">
              <div className="text-center mb-4">
                <h2 className="font-display text-base md:text-lg mb-1.5">You May Also Like</h2>
                <div className="w-8 h-px bg-primary mx-auto" />
              </div>
              <div className="relative px-12">
                <div className="overflow-hidden">
                  <div 
                    className="flex gap-4 transition-transform duration-500 ease-out"
                    style={{
                      transform: `translateX(calc(-${carouselIndex} * (100% / ${itemsPerView} + 0.25rem)))`
                    }}
                  >
                    {relatedProducts.map((p) => (
                      <div key={p._id || p.id} className={`flex-shrink-0 ${
                        itemsPerView === 1 ? 'w-full' :
                        itemsPerView === 2 ? 'w-1/2' :
                        'w-1/3'
                      }`}>
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                {relatedProducts.length > itemsPerView && (
                  <>
                    <button
                      onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                      className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/80 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={carouselIndex === 0}
                      aria-label="Previous"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCarouselIndex(Math.min(maxIndex, carouselIndex + 1))}
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/80 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canGoNext}
                      aria-label="Next"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <ReviewsList 
            productId={product._id || product.id || id!} 
            triggerRefresh={reviewRefresh}
          />
        </section>

        {/* Review Form */}
        <section className="container mx-auto px-3 md:px-4 bg-secondary py-2 md:py-3">
          <ReviewForm 
            productId={product._id || product.id || id!}
            productName={product.name}
            onReviewSubmitted={() => setReviewRefresh(prev => prev + 1)}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
