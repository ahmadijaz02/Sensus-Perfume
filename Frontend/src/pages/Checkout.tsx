import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Minus, Plus, X, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { ordersAPI, settingsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { CartItem } from '@/types/product';
import { StoreSettings } from '@/types/settings';
import pixel from '@/lib/pixel';

const Checkout = () => {
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);
  const hasTrackedCheckout = useRef(false);
  const hasCompletedPurchase = useRef(false);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
  });

  // Fetch store settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsAPI.get();
        setStoreSettings(settings);
      } catch (error) {
        console.error('Failed to fetch store settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check for guest checkout data from router state (Buy Now flow)
    const state = location.state as any;
    if (state?.guestCheckoutItems) {
      try {
        setCheckoutItems(state.guestCheckoutItems);
        const total = state.guestCheckoutItems.reduce(
          (sum: number, item: CartItem) => {
            // Use discounted price if it was pre-calculated (from product page)
            // Otherwise calculate based on product and global discount rules
            if ((item.variant as any).discountedPrice) {
              return sum + (item.variant as any).discountedPrice * item.quantity;
            }
            
            let price = item.variant.price;
            
            // Global discount takes precedence
            if (storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0) {
              price = price * (1 - storeSettings.globalDiscountPercent / 100);
            } else if (item.product?.discountPercent && item.product.discountPercent > 0) {
              // Apply product discount only if no global discount
              price = price * (1 - item.product.discountPercent / 100);
            }
            
            return sum + Math.round(price) * item.quantity;
          },
          0
        );
        setCheckoutTotal(total);
        setIsGuestCheckout(true);
        return; // Exit early if guest checkout data exists
      } catch (error) {
        console.error('Failed to process guest checkout data:', error);
        setIsGuestCheckout(false);
        // Fall through to use cart items
      }
    } else {
      setIsGuestCheckout(false);
    }
    
    // Use cart items if no guest checkout (normal cart checkout flow)
    setCheckoutItems(cartItems);
    setCheckoutTotal(cartTotalPrice);
  }, [cartItems, cartTotalPrice, location.state]);

  useEffect(() => {
    // Pre-fill email and name if user is logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (hasTrackedCheckout.current) return;
    if (checkoutItems.length === 0) return;
    if (sessionStorage.getItem('metaPixelInitiateCheckout') === '1') {
      hasTrackedCheckout.current = true;
      return;
    }

    const contentIds = checkoutItems
      .map((item) => item.product._id || item.product.id)
      .filter(Boolean)
      .map(String);
    const numItems = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
    if (contentIds.length > 0 && numItems > 0 && totalPrice > 0) {
      pixel.initiateCheckout({
        content_ids: contentIds,
        num_items: numItems,
        value: totalPrice,
        currency: 'PKR'
      });
      sessionStorage.setItem('metaPixelInitiateCheckout', '1');
      hasTrackedCheckout.current = true;
    }
  }, [checkoutItems, totalPrice]);

  useEffect(() => {
    return () => {
      if (!hasCompletedPurchase.current) {
        sessionStorage.removeItem('metaPixelInitiateCheckout');
      }
    };
  }, []);

    // Update total price whenever checkout items, settings, or promo status changes
    useEffect(() => {
      const subtotal = getSubtotal();
      const globalDiscount = getGlobalDiscount();
      const promoDiscount = getPromoDiscount();
      const delivery = getDeliveryCost();
      const newTotal = Math.max(0, subtotal - globalDiscount - promoDiscount + delivery);
      setTotalPrice(newTotal);
    }, [checkoutItems, storeSettings?.globalDiscountPercent, storeSettings?.deliveryCost, storeSettings?.freeDeliveryEnabled, storeSettings?.freeDeliveryMinAmount, isPromoApplied]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Apply promo code
  const handleApplyPromo = () => {
    if (!storeSettings) {
      toast.error('Store settings not loaded');
      return;
    }

    if (!promoCodeInput.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    if (promoCodeInput.trim().toUpperCase() === storeSettings.promoCode?.toUpperCase()) {
      const baseSubtotal = checkoutItems.reduce(
        (sum, item) => sum + item.variant.price * item.quantity,
        0
      );
      const rawDiscount = Math.round(baseSubtotal * storeSettings.promoDiscountPercent / 100);
      const maxDiscount = Number(storeSettings.promoDiscountMaxAmount ?? 0);
      const appliedDiscount = maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount;

      setIsPromoApplied(true);
      setAppliedPromoCode(promoCodeInput.trim().toUpperCase());
      toast.success(`Promo code applied! ${storeSettings.promoDiscountPercent}% discount`, {
        description: `You saved PKR ${appliedDiscount}`
      });
    } else {
      toast.error('Invalid promo code', {
        description: 'This promo code does not exist or has expired'
      });
      setIsPromoApplied(false);
      setAppliedPromoCode('');
    }
  };

  // Calculate subtotal with proper discount handling
  // Global discount takes precedence over product discount
  const getSubtotal = () => {
    return checkoutItems.reduce(
      (sum, item) => {
        let price = item.variant.price;
        
        // Global discount takes precedence - apply to base price
        if (storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0) {
          price = price * (1 - storeSettings.globalDiscountPercent / 100);
        } else if (item.product?.discountPercent && item.product.discountPercent > 0) {
          // Apply product discount only if no global discount
          price = price * (1 - item.product.discountPercent / 100);
        }
        
        return sum + Math.round(price) * item.quantity;
      },
      0
    );
  };

  // Calculate global discount based on base prices (before any product discounts)
  const getGlobalDiscount = () => {
    if (!storeSettings || !storeSettings.globalDiscountPercent) return 0;
    
    // Global discount applies to base prices before product discounts
    const baseSubtotal = checkoutItems.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );
    
    return Math.round(baseSubtotal * storeSettings.globalDiscountPercent / 100);
  };

  // Calculate promo discount based on base prices
  const getPromoDiscount = () => {
    if (!isPromoApplied || !storeSettings || !storeSettings.promoDiscountPercent) return 0;
    
    // Promo discount applies to base prices
    const baseSubtotal = checkoutItems.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );
    
    const rawDiscount = Math.round(baseSubtotal * storeSettings.promoDiscountPercent / 100);
    const maxDiscount = Number(storeSettings.promoDiscountMaxAmount ?? 0);
    return maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
  };

  // Get delivery cost - free if enabled and subtotal meets threshold
  // Uses base subtotal (before discounts) to determine free delivery eligibility
  const getDeliveryCost = () => {
    if (!storeSettings) return 0;
    
    // If free delivery is not enabled, always charge delivery
    if (!storeSettings.freeDeliveryEnabled) {
      return storeSettings.deliveryCost || 0;
    }
    
    // Free delivery is enabled, check if minimum is met
    // Use base subtotal (before any discounts) for free delivery calculation
    const baseSubtotal = checkoutItems.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );
    const minAmount = storeSettings.freeDeliveryMinAmount || 0;
    
    // Free delivery if minimum purchase amount is met
    if (minAmount > 0 && baseSubtotal >= minAmount) {
      return 0;
    }
    
    return storeSettings.deliveryCost || 0;
  };

  // Calculate total: (subtotal with product discounts applied) - global discount - promo discount + delivery
  const getTotalPrice = () => {
    const subtotal = getSubtotal(); // Already has product discounts applied
    const globalDiscount = getGlobalDiscount();
    const promoDiscount = getPromoDiscount();
    const delivery = getDeliveryCost();
    
    // If global discount is applied, don't apply product discounts again
    // Otherwise subtotal already has product discounts
    return Math.max(0, subtotal - globalDiscount - promoDiscount + delivery);
  };

  const handleUpdateQuantity = (productId: string, size: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = checkoutItems.map(item => {
      const itemProductId = item.product._id || item.product.id;
      if (itemProductId === productId && item.variant.size === size) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCheckoutItems(updatedItems);
    
    // Recalculate total with updated items
    const newTotal = updatedItems.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );
    setCheckoutTotal(newTotal);
  };

  const handleRemoveItem = (productId: string, size: string) => {
    const updatedItems = checkoutItems.filter(item => {
      const itemProductId = item.product._id || item.product.id;
      return !(itemProductId === productId && item.variant.size === size);
    });
    
    setCheckoutItems(updatedItems);
    
    // Recalculate total
    const newTotal = updatedItems.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );
    setCheckoutTotal(newTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const shippingAddress = `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}, Phone: ${formData.phone}`;
      
      // Create order via API with discount information
      const orderResponse = await ordersAPI.create({
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        shipping_address: shippingAddress,
          total_amount: totalPrice,
        items: checkoutItems.map((item) => ({
          product_id: item.product._id || item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.variant.price,
          // Include discount info for tracking
          productDiscount: item.product?.discountPercent || 0,
          globalDiscount: storeSettings?.globalDiscountPercent || 0,
        })),
      });

      // Order has been successfully created - show success message first
      toast.success('Order placed successfully!', {
        description: 'Thank you for your purchase. You will receive a confirmation email shortly.',
      });

      // Track Meta Pixel Purchase event ONLY after order is confirmed complete
      const purchaseContentIds = checkoutItems
        .map((item) => item.product._id || item.product.id)
        .filter(Boolean)
        .map(String);
      const purchaseItems = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
      if (purchaseContentIds.length > 0 && purchaseItems > 0) {
        pixel.purchase({
          content_ids: purchaseContentIds,
          content_type: 'product',
          value: totalPrice,
          currency: 'PKR',
          num_items: purchaseItems
        });
      }

      hasCompletedPurchase.current = true;
      sessionStorage.removeItem('metaPixelInitiateCheckout');

      // Clear cart if user is logged in
      if (user) {
        clearCart();
      }
      
      // Redirect to home - order is complete
      navigate('/');
    } catch (error: any) {
      console.error('Order placement error:', error);
      toast.error('Unable to complete order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <CartDrawer />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="font-display text-2xl mb-4">Your bag is empty</h1>
            <Button variant="outline" asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
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

      <main className="pt-20">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl md:text-4xl text-center mb-4 animate-slide-up">Checkout</h1>
            <div className="w-16 h-px bg-primary mx-auto mb-12 animate-scale-in\" style={{ animationDelay: '0.2s' }} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
              {/* Form - Shows Second on Mobile */}
              <div className="animate-fade-in order-2 lg:order-1" style={{ animationDelay: '0.3s' }}>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Contact */}
                  <div>
                    <h2 className="font-display text-lg mb-6">Contact Information</h2>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address"
                      required
                      className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300"
                    />
                  </div>

                  {/* Shipping */}
                  <div>
                    <h2 className="font-display text-lg mb-6">Shipping Address</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        required
                        className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300"
                      />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        required
                        className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300"
                      />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Address"
                      required
                      className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300 mt-4"
                    />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        required
                        className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300"
                      />
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Postal code"
                        required
                        className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300"
                      />
                    </div>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Country"
                      required
                      className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300 mt-4"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number (required for delivery)"
                      required
                      className="w-full bg-secondary border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300 mt-4"
                    />
                  </div>

                  {/* Payment (Cash on Delivery only) */}
                  <div>
                    <h2 className="font-display text-lg mb-6">Payment</h2>
                    <div className="p-6 bg-secondary border border-border space-y-3">
                      <p className="text-sm font-medium">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        We currently accept <span className="font-semibold">Cash on Delivery only</span>. 
                        Pay in cash when your order arrives at your delivery address.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You&apos;ll receive an order confirmation email after placing the order.
                      </p>
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full"
                    type="submit"
                    disabled={isProcessing}
                  >
                      {isProcessing ? 'Processing...' : `Complete Order — PKR ${totalPrice}`}
                  </Button>
                </form>
              </div>

              {/* Order Summary - Shows First on Mobile */}
              <div className="animate-fade-in order-1 lg:order-2" style={{ animationDelay: '0.4s' }}>
                <div className="bg-secondary p-8 lg:sticky lg:top-28 border border-primary/10 rounded-lg shadow-lg hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] transition-all duration-500">
                  <h2 className="font-display text-lg mb-6">Order Summary</h2>
                  
                  <div className="space-y-6 mb-8">
                    {checkoutItems.map((item, index) => {
                      const productId = item.product._id || item.product.id;
                      return (
                      <div 
                        key={`${productId}-${item.variant.size}`}
                        className="flex gap-4 group animate-slide-in-right relative"
                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                      >
                        <img
                          src={item.product.image || item.product.images?.[0]}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="flex-1">
                          <h3 className="font-display text-sm mb-1">{item.product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{item.variant.size}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-border rounded-sm overflow-hidden">
                              <button
                                onClick={() => handleUpdateQuantity(productId, item.variant.size, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1.5 hover:bg-secondary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs px-2 min-w-[24px] text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(productId, item.variant.size, item.quantity + 1)}
                                className="p-1.5 hover:bg-secondary hover:text-primary transition-all duration-300"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => handleRemoveItem(productId, item.variant.size)}
                            className="p-1 text-muted-foreground hover:text-destructive hover:scale-110 transition-all duration-300"
                            title="Remove item"
                          >
                            <X size={16} />
                          </button>
                          {/* Calculate item price with discount applied */}
                          {(() => {
                            let price = item.variant.price;
                            const hasGlobalDiscount = storeSettings?.globalDiscountPercent && storeSettings.globalDiscountPercent > 0;
                            const hasProductDiscount = item.product?.discountPercent && item.product.discountPercent > 0;
                            
                            // Global discount takes precedence
                            if (hasGlobalDiscount) {
                              price = price * (1 - storeSettings!.globalDiscountPercent / 100);
                            } else if (hasProductDiscount) {
                              price = price * (1 - item.product!.discountPercent / 100);
                            }
                            
                            const itemTotal = Math.round(price) * item.quantity;
                            
                            return (
                              <div className="flex flex-col items-end gap-1">
                                {(hasGlobalDiscount || hasProductDiscount) && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    PKR {item.variant.price * item.quantity}
                                  </p>
                                )}
                                <p className={`font-display text-sm ${hasGlobalDiscount || hasProductDiscount ? 'text-red-600 font-bold' : ''}`}>
                                  PKR {itemTotal}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-border pt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>PKR {getSubtotal()}</span>
                    </div>

                    {/* Global Discount */}
                    {getGlobalDiscount() > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-2">
                          <Check size={14} />
                          Global Discount ({storeSettings?.globalDiscountPercent}%)
                        </span>
                        <span>- PKR {getGlobalDiscount()}</span>
                      </div>
                    )}

                    {/* Promo Code Input & Validation */}
                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="Enter promo code"
                          className="flex-1 bg-secondary border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                          disabled={isPromoApplied}
                        />
                        <Button
                          type="button"
                          onClick={handleApplyPromo}
                          variant={isPromoApplied ? 'default' : 'outline'}
                          size="sm"
                          disabled={isPromoApplied}
                          className="min-w-fit"
                        >
                          {isPromoApplied ? '✓ Applied' : 'Apply'}
                        </Button>
                      </div>

                      {/* Promo Discount */}
                      {isPromoApplied && getPromoDiscount() > 0 && (
                        <div className="flex justify-between text-sm text-green-600 bg-green-50 -mx-2 px-2 py-2 rounded">
                          <span className="flex items-center gap-2">
                            <Check size={14} />
                            Promo Code ({storeSettings?.promoDiscountPercent}%)
                          </span>
                          <span>- PKR {getPromoDiscount()}</span>
                        </div>
                      )}
                    </div>

                    {/* Delivery Cost */}
                    {getDeliveryCost() > 0 ? (
                      <div className="flex justify-between text-sm pt-4 border-t border-border">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <span>🚚</span>
                          Delivery Cost
                        </span>
                        <span className="font-semibold text-orange-600">+ PKR {getDeliveryCost()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm pt-4 border-t border-border">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <span>🚚</span>
                          Delivery
                        </span>
                        <span className="text-green-600 font-semibold">Free</span>
                      </div>
                    )}

                    {/* Free Delivery Threshold Message */}
                    {storeSettings?.freeDeliveryEnabled && storeSettings?.freeDeliveryMinAmount && storeSettings.freeDeliveryMinAmount > 0 && (
                      <div className="text-xs text-muted-foreground pt-2">
                        {getSubtotal() >= storeSettings.freeDeliveryMinAmount ? (
                          <p className="text-green-600">✓ Free delivery! You&apos;ve reached the minimum purchase amount.</p>
                        ) : (
                          <p>Spend PKR {storeSettings.freeDeliveryMinAmount - getSubtotal()} more for free delivery</p>
                        )}
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between font-display text-lg pt-4 border-t border-border">
                      <span>Total</span>
                       <span>PKR {totalPrice}</span>
                    </div>

                    {/* Savings Info */}
                    {(getGlobalDiscount() > 0 || getPromoDiscount() > 0) && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-900">
                        <p className="font-medium mb-1">💰 You're Saving: <span className="text-green-600">PKR {getGlobalDiscount() + getPromoDiscount()}</span></p>
                        {isPromoApplied && <p>Promo code <strong>{appliedPromoCode}</strong> has been applied!</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
