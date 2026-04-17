import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { useState, useEffect } from 'react';
import { Heart, Star } from 'lucide-react';
import { settingsAPI } from '@/lib/api';
import { StoreSettings } from '@/types/settings';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const minPrice = Math.min(...product.variants.map(v => v.price));
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Fetch store settings on mount to get global discount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsAPI.get();
        setStoreSettings({
          globalDiscountPercent: Number(data.globalDiscountPercent ?? 0),
          promoCode: data.promoCode ?? '',
          promoDiscountPercent: Number(data.promoDiscountPercent ?? 0),
          deliveryCost: Number(data.deliveryCost ?? 0),
          freeDeliveryEnabled: Boolean(data.freeDeliveryEnabled ?? false),
          freeDeliveryMinAmount: Number(data.freeDeliveryMinAmount ?? 0)
        });
      } catch (error) {
        // Fail silently to avoid blocking product display
      }
    };
    loadSettings();
  }, []);

  // Calculate discount: global discount takes precedence over product discount
  const globalDiscountPercent = storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0 
    ? storeSettings.globalDiscountPercent 
    : 0;
  
  const productDiscountPercent = globalDiscountPercent > 0 
    ? 0 
    : (product.discountPercent && product.discountPercent > 0 ? product.discountPercent : 0);
  
  const totalDiscountPercent = globalDiscountPercent || productDiscountPercent;
  const discountedPrice = totalDiscountPercent > 0 ? minPrice * (1 - totalDiscountPercent / 100) : minPrice;
  const hasDiscount = totalDiscountPercent > 0;
  const badgeClass = "w-[110px] px-3 py-1 text-xs tracking-[0.12em] uppercase animate-slide-in-left shadow-lg inline-flex items-center justify-center";

  return (
    <div className="group block relative transition-all duration-500">
      <Link to={`/product/${product.slug || product._id || product.id}`}>
        <div className="relative overflow-hidden mb-4 bg-secondary rounded-sm shadow-md group-hover:shadow-[0_4px_16px_hsl(var(--primary)/0.15)] transition-all duration-500">
          {/* Image with loading shimmer */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-shimmer" />
          )}
          <img
            src={imageError ? '/placeholder.svg' : product.image}
            alt={product.name}
            className={`w-full aspect-[3.5/4] object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2 z-10">
            {hasDiscount && (
              <span className={`bg-red-600 text-white font-bold ${badgeClass}`}>
                -{totalDiscountPercent}%
              </span>
            )}
            {product.new && (
              <span className={`bg-primary text-primary-foreground ${badgeClass}`} style={{ animationDelay: hasDiscount ? '0.1s' : '0s' }}>
                New
              </span>
            )}
            {product.bestseller && (
              <span className={`bg-foreground text-background ${badgeClass}`} style={{ animationDelay: hasDiscount && product.new ? '0.2s' : product.new || hasDiscount ? '0.1s' : '0s' }}>
                Bestseller
              </span>
            )}
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <span className="text-sm tracking-[0.15em] uppercase text-foreground border-b-2 border-primary pb-1 font-medium">
                View Details
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsLiked(!isLiked);
        }}
        className="absolute top-2 right-2 md:top-8 md:right-4 z-20 w-8 h-8 md:w-10 md:h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:bg-background hover:scale-105 hover:shadow-md"
        aria-label="Add to wishlist"
      >
        <Heart 
          size={16}
          className={`md:w-[18px] md:h-[18px] transition-all duration-300 ${isLiked ? 'fill-primary text-primary scale-110 animate-pulse' : 'text-foreground hover:scale-105'}`}
        />
      </button>

      <Link to={`/product/${product.slug || product._id || product.id}`}>
        <div className="text-center space-y-1">
          <p className="text-[10px] md:text-xs text-muted-foreground tracking-[0.15em] uppercase transition-colors group-hover:text-primary">
            {product.brand}
          </p>
          <h3 className="font-display text-sm md:text-base lg:text-lg group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground">{product.concentration}</p>

          {/* Rating and Reviews */}
          {product.averageRating && product.totalReviews !== undefined && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= Math.round(product.averageRating!);
                  return (
                    <Star
                      key={star}
                      size={14}
                      strokeWidth={1.5}
                      fill={isActive ? 'currentColor' : 'none'}
                      className={isActive ? 'text-amber-400' : 'text-gray-300'}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-muted-foreground ml-1">({product.totalReviews})</span>
            </div>
          )}

          {hasDiscount ? (
            <div className="flex flex-col items-center gap-1 pt-2">
              <span className="text-xs md:text-sm text-muted-foreground line-through">PKR {minPrice}</span>
              <p className="font-display text-base md:text-lg">
                From <span className="text-red-600 font-bold">PKR {Math.round(discountedPrice)}</span>
              </p>
            </div>
          ) : (
            <p className="font-display text-base md:text-lg pt-2">
              From <span className="text-primary font-medium">PKR {minPrice}</span>
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
