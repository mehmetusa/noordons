"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import type { CartBook, CartItem } from "@/types/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hasHydrated: boolean;
  addBook: (book: CartBook, quantity?: number) => void;
  removeBook: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "noordons-books-cart";

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number, inventory: number) {
  return Math.max(1, Math.min(quantity, inventory));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const parsed = JSON.parse(storedValue) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from local storage.", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hasHydrated, items]);

  function addBook(book: CartBook, quantity = 1) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.slug === book.slug);

      if (!existingItem) {
        return [
          ...currentItems,
          {
            ...book,
            quantity: clampQuantity(quantity, book.inventory),
          },
        ];
      }

      return currentItems.map((item) =>
        item.slug === book.slug
          ? {
              ...item,
              quantity: clampQuantity(item.quantity + quantity, item.inventory),
            }
          : item,
      );
    });
  }

  function removeBook(slug: string) {
    setItems((currentItems) => currentItems.filter((item) => item.slug !== slug));
  }

  function updateQuantity(slug: string, quantity: number) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: clampQuantity(quantity, item.inventory),
            }
          : item,
      ),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        hasHydrated,
        addBook,
        removeBook,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
