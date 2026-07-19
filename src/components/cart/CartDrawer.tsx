import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { settingsAPI } from '@/lib/api';
import { StoreSettings } from '@/types/settings';
import pixel from '@/lib/pixel';

const CartDrawer = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

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
        // Fail silently
      }
    };
    loadSettings();
  }, []);

  const getDiscountedUnitPrice = (item: any) => {
    let price = item.variant.price;
    const hasGlobalDiscount = storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0;
    const hasProductDiscount = item.product?.discountPercent && item.product.discountPercent > 0;

    if (hasGlobalDiscount) {
      price = price * (1 - storeSettings!.globalDiscountPercent / 100);
    } else if (hasProductDiscount) {
      price = price * (1 - item.product.discountPercent / 100);
    }

    return Math.round(price);
  };

  const getCartSubtotal = () => {
    return items.reduce((sum, item) => sum + getDiscountedUnitPrice(item) * item.quantity, 0);
  };

  const handleCheckoutClick = () => {
    const contentIds = items
      .map((item) => item.product._id || item.product.id)
      .filter(Boolean)
      .map(String);
    const numItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const value = getCartSubtotal();

    if (contentIds.length > 0 && numItems > 0) {
      pixel.initiateCheckout({
        content_ids: contentIds,
        num_items: numItems,
        value,
        currency: 'PKR'
      });
      sessionStorage.setItem('metaPixelInitiateCheckout', '1');
    }
  };

  useEffect(() => {
    if (!isCartOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isCartOpen]);

  // Log cart state when drawer opens
  useEffect(() => {
    if (isCartOpen) {
      console.log('CartDrawer: Opened with items', { count: items.length, items });
    }
  }, [isCartOpen, items]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-[100dvh] w-full sm:max-w-md bg-background border-l border-border z-50 flex flex-col animate-slide-in-right shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="font-display text-lg md:text-xl tracking-wide flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            Shopping Bag
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:text-primary hover:scale-110 transition-all duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <ShoppingBag size={48} className="text-muted-foreground mb-4 animate-float" />
              <p className="text-muted-foreground mb-2">Your bag is empty</p>
              <p className="text-sm text-muted-foreground mb-6">
                Discover our exquisite collection
              </p>
              <Button variant="outline" onClick={() => setIsCartOpen(false)} asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {items.map((item, index) => {
                const productId = item.product._id || item.product.id;
                return (
                <div
                  key={`${productId}-${item.variant.size}`}
                  className="flex gap-3 md:gap-4 pb-4 md:pb-6 border-b border-border animate-slide-in-right group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={item.product.image || item.product.images?.[0]}
                    alt={item.product.name}
                    className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="flex-1">
                    <h3 className="font-display text-sm mb-1">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{item.product.brand}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.variant.size}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 border border-border rounded-sm overflow-hidden">
                        <button
                          onClick={() => updateQuantity(productId, item.variant.size, item.quantity - 1)}
                          className="p-2 hover:text-primary hover:bg-secondary transition-all duration-300"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(productId, item.variant.size, item.quantity + 1)}
                          className="p-2 hover:text-primary hover:bg-secondary transition-all duration-300"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {(() => {
                        const discountedUnit = getDiscountedUnitPrice(item);
                        const hasDiscount = discountedUnit !== item.variant.price;
                        const lineTotal = discountedUnit * item.quantity;
                        return (
                          <div className="flex flex-col items-end gap-1">
                            {hasDiscount && (
                              <span className="text-xs text-muted-foreground line-through">
                                PKR {item.variant.price * item.quantity}
                              </span>
                            )}
                            <p className="font-display text-sm">PKR {lineTotal}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(productId, item.variant.size)}
                    className="self-start p-1 text-muted-foreground hover:text-destructive hover:scale-110 transition-all duration-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-border space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm tracking-wide uppercase">Subtotal</span>
              <span className="font-display text-lg md:text-xl">PKR {getCartSubtotal()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout
            </p>
            <Button variant="hero" size="lg" className="w-full" asChild>
              <Link 
                to="/checkout" 
                onClick={() => {
                  handleCheckoutClick();
                  // Close cart when navigating to checkout
                  setIsCartOpen(false);
                }}
              >
                Checkout
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setIsCartOpen(false)}
              asChild
            >
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
