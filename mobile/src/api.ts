import {
  AssistantResponse,
  CartSummary,
  Category,
  Order,
  Product,
  User,
} from './types';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api').replace(/\/$/, '');
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    let message = 'Unable to communicate with VoiceMart.';
    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, username: string, password: string, full_name: string) =>
      request<{ access_token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, full_name }),
      }),
    me: () => request<User>('/auth/me'),
  },
  products: {
    list: (params: Record<string, string | number | boolean | undefined> = {}) => {
      const query = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      return request<{ products: Product[]; total: number }>(`/products${query ? `?${query}` : ''}`);
    },
    categories: () => request<Category[]>('/products/categories'),
    get: (id: number) => request<Product>(`/products/${id}`),
  },
  cart: {
    get: () => request<CartSummary>('/cart'),
    add: (product_id: number, quantity = 1) =>
      request<CartSummary>('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
    update: (id: number, quantity: number) =>
      request<CartSummary>(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    remove: (id: number) => request<CartSummary>(`/cart/${id}`, { method: 'DELETE' }),
    clear: () => request<void>('/cart/clear/all', { method: 'DELETE' }),
  },
  orders: {
    create: (shipping_address: string, payment_method: string) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify({ shipping_address, payment_method }) }),
    list: () => request<Order[]>('/orders'),
  },
  assistant: {
    command: (command: string) =>
      request<AssistantResponse>('/assistant/command', {
        method: 'POST',
        body: JSON.stringify({ command, session_id: `mobile_${Date.now()}` }),
      }),
    recommendations: (limit = 4) =>
      request<Array<{ product: Product; score: number; reason: string }>>('/assistant/recommendations', {
        method: 'POST',
        body: JSON.stringify({ limit }),
      }),
  },
};
