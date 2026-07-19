import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '@/types/product';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number, openCart?: boolean) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addToCartInProgress, setAddToCartInProgress] = useState(false);
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // Load cart on mount or when user changes
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Load from server if logged in
          try {
            const token = localStorage.getItem('auth-token');
            const response = await fetch(`${API_URL}/cart`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            if (response.ok) {
              const data = await response.json();
              const loadedItems = data.items || [];
              console.log('CartContext: Loaded from server', { count: loadedItems.length, items: loadedItems });
              setItems(loadedItems);
            }
          } catch (error) {
            console.error('Failed to load cart from server:', error);
          }
        } else {
          // No guest cart - must login to add to cart
          setItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user]);

  const addToCart = async (product: Product, variant: ProductVariant, quantity: number = 1, openCart: boolean = false) => {
    // Must be logged in to add to cart
    if (!user) {
      toast.error('Please login to add items to your cart');
      return;
    }

    // Prevent duplicate requests
    if (addToCartInProgress) {
      console.warn('Add to cart already in progress, ignoring duplicate request');
      return;
    }

    setAddToCartInProgress(true);
    try {
      const productId = product._id || product.id;
      console.log('CartContext: addToCart called', { 
        product: { _id: product._id, id: product.id, name: product.name },
        variant: { size: variant.size, price: variant.price },
        quantity 
      });

      if (!productId) {
        throw new Error('Product ID is missing');
      }
      
      // OPTIMISTIC UPDATE: Update UI immediately
      const existingItemIndex = items.findIndex(
        item => (item.product._id || item.product.id) === productId && item.variant.size === variant.size
      );

      const previousItems = items;
      let optimisticItems: CartItem[];

      if (existingItemIndex > -1) {
        // Update existing item quantity
        optimisticItems = items.map((item, idx) =>
          idx === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        optimisticItems = [...items, { product, variant, quantity }];
      }

      // Update state immediately for instant UI feedback
      setItems(optimisticItems);
      
      // Show instant visual feedback
      toast.success(`Added ${product.name} to cart!`);
      
      // Auto-open cart drawer is disabled
      
      console.log('CartContext: Optimistic update applied', { itemsCount: optimisticItems.length });

      // Send to server in background
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      console.log('CartContext: Syncing with server', { productId, size: variant.size, quantity });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const response = await fetch(`${API_URL}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            productId,
            size: variant.size,
            quantity
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('CartContext: Server sync failed', errorData);
          // Revert to previous state on error
          setItems(previousItems);
          toast.error('Failed to sync cart. Please try again.');
          throw new Error(errorData.error || 'Failed to add to cart');
        }

        // Server now returns success confirmation only (optimized response)
        const responseData = await response.json();
        console.log('CartContext: Synced with server', { 
          success: responseData.success,
          cartItemCount: responseData.cartItemCount
        });
        
        // Refresh cart in background to get complete data
        if (responseData.success) {
          console.log('CartContext: Add successful, refreshing in background');
          refreshCart().catch(err => console.log('Background refresh error:', err));
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        // Handle abort errors
        if (error.name === 'AbortError') {
          console.error('CartContext: Request aborted (timeout or cancelled)');
          // Keep the optimistic update since server took too long
          toast.warning('Server is slow, but item was added');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('CartContext: addToCart error', error);
      toast.error('Failed to add item. Please try again.');
    } finally {
      setAddToCartInProgress(false);
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    setIsLoading(true);
    try {
      // Optimistic update - remove from UI immediately
      const previousItems = items;
      setItems(prev =>
        prev.filter(
          item => !((item.product._id || item.product.id) === productId && item.variant.size === size)
        )
      );

      if (user) {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/cart/remove`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId, size })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to remove from cart:', errorData);
          // Revert on error
          setItems(previousItems);
          toast.error('Failed to remove item from cart');
          throw new Error(errorData.error || 'Failed to remove item');
        }

        const data = await response.json();
        console.log('Item removed from cart:', data);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, size: string, quantity: number) => {
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        await removeFromCart(productId, size);
        return;
      }

      // Optimistic update - update UI immediately
      const previousItems = items;
      setItems(prev =>
        prev.map(item =>
          (item.product._id || item.product.id) === productId && item.variant.size === size
            ? { ...item, quantity }
            : item
        )
      );

      if (user) {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/cart/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId, size, quantity })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update quantity:', errorData);
          // Revert on error
          setItems(previousItems);
          toast.error('Failed to update quantity');
          throw new Error(errorData.error || 'Failed to update quantity');
        }

        const data = await response.json();
        console.log('Quantity updated:', data);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      if (user) {
        const token = localStorage.getItem('auth-token');
        await fetch(`${API_URL}/cart/clear`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh cart from server (useful when opening drawer to ensure sync)
  const refreshCart = async () => {
    try {
      if (user) {
        const token = localStorage.getItem('auth-token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for refresh
        
        try {
          const response = await fetch(`${API_URL}/cart`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const loadedItems = data.items || [];
            console.log('CartContext: Refreshed cart from server', { count: loadedItems.length });
            setItems(loadedItems);
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            console.log('CartContext: Refresh request timed out (non-critical)');
            return; // Fail silently for refresh
          }
          console.error('Failed to refresh cart from server:', error);
        }
      } else {
        try {
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            const parsed = JSON.parse(savedCart);
            console.log('CartContext: Refreshed cart from localStorage', { count: parsed.length });
            setItems(parsed);
          }
        } catch (error) {
          console.error('Failed to refresh cart from localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
