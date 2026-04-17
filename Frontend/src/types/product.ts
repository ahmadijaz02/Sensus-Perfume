export interface FragranceNote {
  type: 'top' | 'heart' | 'base';
  notes: string[];
}

export interface ProductVariant {
  size: string;
  price: number;
  originalPrice?: number;
}

export interface Review {
  _id?: string;
  productId: string;
  authorName: string;
  authorEmail: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  helpful?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Product {
  _id?: string; // MongoDB ID
  id?: string;  // Fallback ID
  slug?: string; // URL-friendly slug
  name: string;
  brand: string;
  description: string;
  shortDescription: string;
  category: 'men' | 'women' | 'unisex';
  image: string;
  images: string[];
  variants: ProductVariant[];
  fragranceNotes: FragranceNote[];
  concentration: string;
  featured?: boolean;
  new?: boolean;
  bestseller?: boolean;
  stock?: number;
  discountPercent?: number; // Discount percentage (0-100)
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  shipping_address: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  items?: any[];
}
