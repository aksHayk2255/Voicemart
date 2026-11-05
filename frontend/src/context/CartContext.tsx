import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, CartSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartSummary;
  itemCount: number;
  total: number;
  isLoading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const defaultCart: CartSummary = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  item_count: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartSummary>(defaultCart);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(defaultCart);
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.cart.get();
      setCart(data);
    } catch {
      // Ignored if user not logged in or error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to add products to your cart.');
    }
    const updated = await api.cart.add(productId, quantity);
    setCart(updated);
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const updated = await api.cart.update(itemId, quantity);
    setCart(updated);
  };

  const removeItem = async (itemId: number) => {
    const updated = await api.cart.remove(itemId);
    setCart(updated);
  };

  const clearCart = async () => {
    await api.cart.clear();
    setCart(defaultCart);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart.item_count,
        total: cart.total,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

