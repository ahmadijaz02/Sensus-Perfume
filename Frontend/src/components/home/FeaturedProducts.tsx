import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { productsAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⚡ Fetching featured products (fast mode)...');
      // Fetch products WITHOUT reviews first for instant display
      const response = await productsAPI.getAll(false);
      
      // Handle both new paginated and old response formats
      const allProducts = Array.isArray(response) 
        ? response 
        : (response?.data || []);
      
      console.log('Fetched total products:', allProducts.length);
      
      const featured = allProducts.filter((p: Product) => p.featured);
      
      console.log('✅ Featured products found:', featured.length);
      
      // Display products immediately
      setFeaturedProducts(featured);
      setLoading(false);
      
      // Load reviews in background (non-blocking)
      if (featured.length > 0) {
        console.log('🔄 Loading reviews in background...');
        loadReviewsInBackground(featured);
      }
    } catch (error: any) {
      console.error('Failed to fetch featured products:', error);
      setError(error.message || 'Failed to load products');
      setLoading(false);
    }
  };

  const loadReviewsInBackground = async (products: Product[]) => {
    try {
      const enriched = await productsAPI.getAll(true);
      const allEnriched = Array.isArray(enriched) ? enriched : (enriched?.data || []);
      const featuredEnriched = allEnriched.filter((p: Product) => p.featured);
      setFeaturedProducts(featuredEnriched);
      console.log('✅ Reviews loaded');
    } catch (error) {
      console.log('Reviews loading failed (non-critical):', error);
    }
  };

  useEffect(() => {
    // Only run observer after products are loaded
    if (featuredProducts.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.product-card-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [featuredProducts]);

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

  // Reset carousel index when items per view changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [itemsPerView]);

  const maxIndex = Math.max(0, featuredProducts.length - itemsPerView);
  const canGoNext = carouselIndex < maxIndex;

  return (
    <section className="py-12 md:py-16 lg:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-secondary to-transparent opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16 scroll-reveal">
          <p className="font-accent text-primary tracking-[0.3em] uppercase mb-3 text-sm animate-slide-in-left">Curated Selection</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Featured Fragrances
          </h2>
          <div className="w-16 h-px bg-primary mx-auto mb-6 animate-scale-in" style={{ animationDelay: '0.4s' }} />
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
            Discover our most coveted scents, handpicked for their exceptional craftsmanship and enduring appeal.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="text-lg text-muted-foreground">Loading featured products...</div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-lg text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchFeaturedProducts}>
              Try Again
            </Button>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">No featured products available at the moment</p>
            <Button variant="outline" asChild>
              <Link to="/shop">Browse All Products</Link>
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-hidden px-12">
              <div 
                className="flex gap-4 transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(calc(-${carouselIndex} * (100% / ${itemsPerView} + 0.25rem)))`
                }}
              >
                {featuredProducts.map((product) => (
                  <div
                    key={product._id || product.id}
                    className={`flex-shrink-0 ${
                      itemsPerView === 1 ? 'w-full' :
                      itemsPerView === 2 ? 'w-1/2' :
                      'w-1/3'
                    }`}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            {featuredProducts.length > itemsPerView && (
              <>
                <button
                  onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2.5 rounded-full hover:bg-primary/80 z-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={carouselIndex === 0}
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setCarouselIndex(Math.min(maxIndex, carouselIndex + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2.5 rounded-full hover:bg-primary/80 z-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canGoNext}
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        )}

        <div className="text-center animate-scale-in mt-8 md:mt-12" style={{ animationDelay: '1s' }}>
          <Button variant="outline" size="lg" asChild className="hover-lift group">
            <Link to="/shop">
              View All Fragrances
              <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
