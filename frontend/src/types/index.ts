export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt?: string;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  base_price: number;
  discount_percent: number;
  final_price: number;
  rating: number;
  review_count: number;
  image_url: string;
  images?: Array<{ id: string; image_url: string; is_primary: boolean; alt_text?: string }>;
  reviews?: Array<{ id: string; rating: number; title: string; comment: string; author_name: string; created_at: string }>;
  stock: number;
  in_stock: boolean;
  warehouse_city?: string;
  category?: string;
  category_name?: string;
  category_slug?: string;
}

export interface CartItem {
  item_id: string;
  product_id: string;
  name: string;
  slug: string;
  brand: string;
  base_price: number;
  discount_percent: number;
  unit_price: number;
  quantity: number;
  total_item_price: number;
  image_url: string;
  available_stock: number;
}

export interface CartSummary {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  finalAmount: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total_amount: number;
  payment_status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
  payment_method?: string;
  shipping_snapshot: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  tracking_number?: string;
  carrier?: string;
  shipment_status?: string;
  created_at: string;
  items?: Array<{
    id: string;
    product_id: string;
    product_name: string;
    slug?: string;
    image_url?: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }>;
  shipment?: {
    tracking_number: string;
    carrier: string;
    current_status: string;
    estimated_delivery?: string;
    timeline: Array<{
      id: string;
      status: string;
      location: string;
      notes: string;
      timestamp: string;
    }>;
  };
}
