export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  category_id: number;
  price: number;
  original_price?: number;
  description: string;
  image_url: string;
  rating: number;
  rating_count: number;
  stock: number;
  is_featured: boolean;
  specifications: string;
  created_at: string;
  category?: Category;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  item_count: number;
}

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

export interface AssistantResponse {
  transcript: string;
  spoken_response: string;
  display_response: string;
  action: string;
  products?: Product[];
}
