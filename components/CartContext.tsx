'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  variant?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string;
  couponApplied: boolean;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  getQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '300ml-cart';

export const TEA_UNIT_PRICE = 160;
export const TEA_LIST_PRICE = 250;

export const TEA_PRODUCT = {
  id: '300ml-tea-adrak-elaichi',
  name: '300ml Tea — Adrak & Elaichi',
  price: TEA_UNIT_PRICE,
  originalPrice: TEA_LIST_PRICE,
  image: '/figma-home/product-box.png',
  variant: 'Adrak & Elaichi',
};

function normalizeItem(item: Omit<CartItem, 'quantity'> | CartItem): Omit<CartItem, 'quantity'> {
  const isTea = !item.id || item.id === TEA_PRODUCT.id;
  if (isTea) {
    return {
      ...TEA_PRODUCT,
      ...item,
      id: TEA_PRODUCT.id,
      name: item.name || TEA_PRODUCT.name,
      price: TEA_UNIT_PRICE,
      originalPrice: TEA_LIST_PRICE,
      image: item.image || TEA_PRODUCT.image,
      variant: item.variant || TEA_PRODUCT.variant,
    };
  }
  return {
    ...item,
    image: item.image || TEA_PRODUCT.image,
  };
}

function readStoredCart(): { items: CartItem[]; couponCode: string; couponApplied: boolean } {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return { items: [], couponCode: '', couponApplied: false };
    const parsed = JSON.parse(saved);
    const items: CartItem[] = (parsed.items || []).map((item: CartItem) => ({
      ...normalizeItem(item),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));
    return {
      items,
      couponCode: parsed.couponCode || '',
      couponApplied: Boolean(parsed.couponApplied),
    };
  } catch {
    return { items: [], couponCode: '', couponApplied: false };
  }
}

function writeStoredCart(payload: { items: CartItem[]; couponCode: string; couponApplied: boolean }) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hasLocalEdits = useRef(false);

  useEffect(() => {
    if (!hasLocalEdits.current) {
      const stored = readStoredCart();
      setItems(stored.items);
      setCouponCode(stored.couponCode);
      setCouponApplied(stored.couponApplied);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStoredCart({ items, couponCode, couponApplied });
  }, [items, couponCode, couponApplied, loaded]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY || event.newValue == null) return;
      try {
        const parsed = JSON.parse(event.newValue);
        setItems(
          (parsed.items || []).map((item: CartItem) => ({
            ...normalizeItem(item),
            quantity: Math.max(1, Number(item.quantity) || 1),
          }))
        );
        setCouponCode(parsed.couponCode || '');
        setCouponApplied(Boolean(parsed.couponApplied));
      } catch {
        // ignore malformed storage
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const qty = Math.max(1, Math.floor(quantity) || 1);
    const canonical = normalizeItem(item);
    hasLocalEdits.current = true;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === canonical.id);
      if (existing) {
        return prev.map((i) =>
          i.id === canonical.id
            ? { ...i, ...canonical, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...canonical, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    hasLocalEdits.current = true;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    hasLocalEdits.current = true;
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => {
    hasLocalEdits.current = true;
    setItems([]);
    setCouponCode('');
    setCouponApplied(false);
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'CHAI20' || normalized === '300ML') {
      hasLocalEdits.current = true;
      setCouponCode(normalized);
      setCouponApplied(true);
      return true;
    }
    return false;
  }, []);

  const removeCoupon = useCallback(() => {
    hasLocalEdits.current = true;
    setCouponCode('');
    setCouponApplied(false);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const getQuantity = useCallback(
    (id: string) => items.find((i) => i.id === id)?.quantity ?? 0,
    [items]
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.2) : 0;
  const total = subtotal - discount;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discount,
        total,
        couponCode,
        couponApplied,
        applyCoupon,
        removeCoupon,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        getQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
