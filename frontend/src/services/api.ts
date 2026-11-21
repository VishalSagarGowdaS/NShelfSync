import { Product, Category, CartSummary, Order, User, Address } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('shelfsync_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('shelfsync_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('shelfsync_token');
}

export function getSessionId(): string {
  let sid = localStorage.getItem('shelfsync_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('shelfsync_session_id', sid);
  }
  return sid;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Products & Categories
  getProducts: (params?: Record<string, any>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; products: Product[]; total: number; totalPages: number }>(`/products?${qs}`);
  },
  getProductBySlug: (slug: string) => {
    return request<{ success: boolean; product: Product }>(`/products/${slug}`);
  },
  getCategories: () => {
    return request<{ success: boolean; categories: Category[] }>('/categories');
  },
  search: (params: Record<string, any>) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; products: Product[]; total: number; totalPages: number; source: string }>(`/search?${qs}`);
  },

  // Auth
  login: (credentials: { email: string; password: string }) => {
    return request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register: (payload: { email: string; password: string; fullName: string; phone?: string }) => {
    return request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getProfile: () => {
    return request<{ success: boolean; user: User; addresses: Address[] }>('/auth/me');
  },
  updateProfile: (data: { fullName?: string; phone?: string }) => {
    return request<{ success: boolean; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Addresses
  getAddresses: () => {
    return request<{ success: boolean; addresses: Address[] }>('/addresses');
  },
  addAddress: (address: any) => {
    return request<{ success: boolean; address: Address }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  },
  deleteAddress: (id: string) => {
    return request<{ success: boolean }>(`/addresses/${id}`, {
      method: 'DELETE',
    });
  },

  // Cart
  getCart: () => {
    return request<{ success: boolean; cart: CartSummary }>('/cart');
  },
  addToCart: (productId: string, quantity: number = 1) => {
    return request<{ success: boolean; message: string }>('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },
  updateCartItem: (itemId: string, quantity: number) => {
    return request<{ success: boolean; message: string }>(`/cart/item/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },
  removeCartItem: (itemId: string) => {
    return request<{ success: boolean; message: string }>(`/cart/item/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Wishlist
  getWishlist: () => {
    return request<{ success: boolean; items: any[] }>('/wishlist');
  },
  addToWishlist: (productId: string) => {
    return request<{ success: boolean; message: string }>('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },
  removeFromWishlist: (productId: string) => {
    return request<{ success: boolean; message: string }>(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  },

  // Orders & Checkout
  createOrder: (payload: { shippingAddress: any; paymentMethod: string; items?: any[] }) => {
    return request<{ success: boolean; order: any; payment?: any; error?: string }>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  verifyPayment: (payload: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    return request<{ success: boolean; message: string }>('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getMyOrders: () => {
    return request<{ success: boolean; orders: Order[] }>('/orders/my-orders');
  },
  getOrderDetails: (orderNumber: string) => {
    return request<{ success: boolean; order: Order }>(`/orders/${orderNumber}`);
  },

  // Admin
  getAdminOverview: () => {
    return request<{ success: boolean; metrics: any; recentOrders: any[]; bestSellers: any[] }>('/admin/overview');
  },
  getAdminProducts: () => {
    return request<{ success: boolean; products: any[] }>('/admin/products');
  },
  createAdminProduct: (data: any) => {
    return request<{ success: boolean; product: any }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateProductStock: (id: string, stock: number) => {
    return request<{ success: boolean; message: string }>(`/admin/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  },
  getAdminOrders: () => {
    return request<{ success: boolean; orders: any[] }>('/admin/orders');
  },
  updateOrderStatus: (id: string, data: { status: string; notes?: string; location?: string }) => {
    return request<{ success: boolean; message: string }>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  getNotificationLogs: () => {
    return request<{ success: boolean; logs: any[] }>('/admin/notifications');
  },

  // Health
  getHealth: () => {
    return request<any>('/health');
  },
};
