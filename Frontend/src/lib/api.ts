// Use local backend in development, production backend in production
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://sensusperfume.com/api';

// Auth helpers
export const getAuthToken = () => localStorage.getItem('auth-token');
export const setAuthToken = (token: string) => localStorage.setItem('auth-token', token);
export const removeAuthToken = () => localStorage.removeItem('auth-token');

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    
    return response.json();
  },

  requestPasswordReset: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send reset code');
    }

    return data;
  },

  resetPassword: async (resetToken: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  },

  verifyResetCode: async (email: string, code: string) => {
    const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Invalid or expired code');
    }

    return data;
  }
};

// Newsletter API
export const newsletterAPI = {
  subscribe: async (email: string) => {
    const response = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to subscribe');
    }

    return data;
  }
};

// Orders API
export const ordersAPI = {
  create: async (orderData: {
    customer_email: string;
    customer_name: string;
    shipping_address: string;
    total_amount: number;
    items: any[];
  }) => {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_URL}/orders`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return response.json();
  },

  getMyOrders: async () => {
    const response = await fetch(`${API_URL}/orders/my-orders`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return response.json();
  },

  updateStatus: async (id: string, status: string) => {
    const response = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update status');
    }
    
    return response.json();
  },

  updateTracking: async (id: string, tracking_number: string | null, notes: string | null) => {
    const response = await fetch(`${API_URL}/orders/${id}/tracking`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ tracking_number, notes })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update tracking');
    }
    
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete order');
    }
    
    return response.json();
  }
};

// Products API
// No client-side cache - rely on server cache for performance
// Server cache clears immediately on updates, ensuring customers see fresh data

export const productsAPI = {
  getAll: async (enrichWithReviews: boolean = false) => {
    // Always fetch from server - server has its own cache
    // This ensures customers always get fresh data after admin updates
    const response = await fetch(`${API_URL}/products?page=1&limit=1000`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const result = await response.json();
    const products = result.data || result; // Handle both new paginated and old response
    
    // Server already includes review stats in response
    // Only enrich if explicitly requested and data is missing
    if (enrichWithReviews) {
      const needsEnrichment = products.some(
        (p: any) => p.averageRating === undefined || p.totalReviews === undefined
      );
      
      if (needsEnrichment) {
        return Promise.all(
          products.map(async (product: any) => {
            if (product.averageRating !== undefined && product.totalReviews !== undefined) {
              return product;
            }
            try {
              const reviews = await reviewsAPI.getByProductId(product._id);
              if (reviews.length > 0) {
                const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
                return {
                  ...product,
                  averageRating: Math.round(avgRating * 10) / 10,
                  totalReviews: reviews.length
                };
              }
            } catch (error) {
              // Continue without review data if it fails
            }
            return product;
          })
        );
      }
    }
    
    return products;
  },

  getCount: async () => {
    const response = await fetch(`${API_URL}/products/count`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product count');
    }
    
    return response.json();
  },

  getById: async (id: string) => {
    try {
      console.log('Fetching product by ID:', id);
      const response = await fetch(`${API_URL}/products/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      
      const product = await response.json();
      console.log('Product fetched:', {
        id: product._id,
        name: product.name,
        hasDescription: !!product.description,
        descriptionLength: product.description?.length,
        hasVariants: !!product.variants,
        variantsCount: product.variants?.length
      });
      
      // Don't wait for reviews - they load asynchronously after
      // This makes the product page load much faster
      return product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  getByIdWithReviews: async (id: string) => {
    const response = await fetch(`${API_URL}/products/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    
    const product = await response.json();
    
    // Enrich with review data
    try {
      const reviews = await reviewsAPI.getByProductId(id);
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
        return {
          ...product,
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length
        };
      }
    } catch (error) {
      // Continue without review data if it fails
    }
    
    return product;
  },

  create: async (productData: any) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
    
    return response.json();
  },

  update: async (id: string, productData: any) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || 'Failed to update product');
    }
    
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    
    return response.json();
  }
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  },

  getCount: async () => {
    const response = await fetch(`${API_URL}/users/count`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user count');
    }
    
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    
    return response.json();
  },

  update: async (id: string, userData: any) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    
    return response.json();
  }
};

// Reviews API
export const reviewsAPI = {
  create: async (productId: string, reviewData: { rating: number; title: string; comment: string; authorName: string; authorEmail: string }) => {
    const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review');
    }
    
    return response.json();
  },

  getByProductId: async (productId: string) => {
    const response = await fetch(`${API_URL}/products/${productId}/reviews`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reviews');
    }
    
    return response.json();
  },

  delete: async (productId: string, reviewId: string) => {
    const response = await fetch(`${API_URL}/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete review');
    }
    
    return response.json();
  },

  markHelpful: async (productId: string, reviewId: string) => {
    const response = await fetch(`${API_URL}/products/${productId}/reviews/${reviewId}/helpful`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark review as helpful');
    }
    
    return response.json();
  }
};
// Cart API
export const cartAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/cart`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }
    
    return response.json();
  },

  add: async (productId: string, size: string, quantity: number) => {
    const response = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ productId, size, quantity })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add to cart');
    }
    
    return response.json();
  },

  remove: async (productId: string, size: string) => {
    const response = await fetch(`${API_URL}/cart/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ productId, size })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove from cart');
    }
    
    return response.json();
  },

  update: async (productId: string, size: string, quantity: number) => {
    const response = await fetch(`${API_URL}/cart/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ productId, size, quantity })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update cart');
    }
    
    return response.json();
  },

  clear: async () => {
    const response = await fetch(`${API_URL}/cart/clear`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear cart');
    }
    
    return response.json();
  }
};

// Settings API
export const settingsAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/settings`);

    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    return response.json();
  },

  update: async (payload: {
    globalDiscountPercent: number;
    promoCode: string;
    promoDiscountPercent: number;
    promoDiscountMaxAmount: number;
    deliveryCost: number;
    freeDeliveryEnabled: boolean;
    freeDeliveryMinAmount: number;
  }) => {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let message = 'Failed to update settings';

      try {
        const parsed = JSON.parse(errorText);
        message = parsed.error || parsed.message || message;
      } catch {
        if (errorText) message = errorText;
      }

      throw new Error(message);
    }

    return response.json();
  }
};