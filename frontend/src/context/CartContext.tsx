import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartSummary | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCart();
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } catch {
      // Quiet fail if guest or offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    await api.addToCart(productId, quantity);
    await refreshCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    await api.updateCartItem(itemId, quantity);
    await refreshCart();
  };

  const removeFromCart = async (itemId: string) => {
    await api.removeCartItem(itemId);
    await refreshCart();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount || 0,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
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
