import { 
  User, Product, Category, CartSummary, Order, 
  VoiceCommandResponse, ComparisonResponse, RecommendationItem 
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('voicemart_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred while communicating with the server.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    register: (data: { email: string; username: string; password: string; full_name?: string }) =>
      request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/auth/me'),
  },

  // Products
  products: {
    list: (params?: {
      category?: string;
      brand?: string;
      min_price?: number;
      max_price?: number;
      rating?: number;
      search?: string;
      sort_by?: string;
      featured?: boolean;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.append(key, String(val));
          }
        });
      }
      const query = searchParams.toString();
      return request<{ products: Product[]; total: number; page: number; limit: number }>(
        `/products${query ? `?${query}` : ''}`
      );
    },
    categories: () => request<Category[]>('/products/categories'),
    get: (id: number) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  // Cart
  cart: {
    get: () => request<CartSummary>('/cart'),
    add: (productId: number, quantity: number = 1) =>
      request<CartSummary>('/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
      }),
    update: (itemId: number, quantity: number) =>
      request<CartSummary>(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    remove: (itemId: number) =>
      request<CartSummary>(`/cart/${itemId}`, {
        method: 'DELETE',
      }),
    clear: () =>
      request<void>('/cart/clear/all', {
        method: 'DELETE',
      }),
  },

  // Orders
  orders: {
    create: (data: { shipping_address: string; payment_method: string }) =>
      request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => request<Order[]>('/orders'),
    get: (id: number) => request<Order>(`/orders/${id}`),
  },

  // AI Assistant
  assistant: {
    command: (command: string, currentProductId?: number) =>
      request<VoiceCommandResponse>('/assistant/command', {
        method: 'POST',
        body: JSON.stringify({
          command,
          current_product_id: currentProductId,
          session_id: 'session_' + Math.random().toString(36).substring(2, 9),
        }),
      }),
    recommendations: (params: {
      category_slug?: string;
      budget?: number;
      current_product_id?: number;
      limit?: number;
    }) =>
      request<RecommendationItem[]>('/assistant/recommendations', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    compare: (productIds: number[]) =>
      request<ComparisonResponse>('/assistant/compare', {
        method: 'POST',
        body: JSON.stringify({ product_ids: productIds }),
      }),
  },

  // Admin
  admin: {
    stats: () =>
      request<{
        total_users: number;
        total_products: number;
        total_orders: number;
        total_revenue: number;
        low_stock_count: number;
        out_of_stock_count: number;
      }>('/admin/stats'),
    users: () => request<User[]>('/admin/users'),
    orders: () => request<Order[]>('/admin/orders'),
    updateOrderStatus: (orderId: number, status: string) =>
      request<{ message: string; order_id: number; status: string }>(
        `/admin/orders/${orderId}/status?status=${encodeURIComponent(status)}`,
        { method: 'PUT' }
      ),
  },
};

