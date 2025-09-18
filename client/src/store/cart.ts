import { create } from "zustand";

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

export interface CartState {
  items: CartItem[];
  removingIds: number[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  removeItemAnimated: (productId: number, delay?: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  removingIds: [],

  addItem: (item, qty = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + qty }
            : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: qty }] });
    }
  },

  updateQty: (productId, qty) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i
      ),
    }),

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),

  removeItemAnimated: (productId, delay = 260) => {
    const { removingIds } = get();
    if (removingIds.includes(productId)) return;
    set({ removingIds: [...removingIds, productId] });
    setTimeout(() => {
      const { items, removingIds } = get();
      set({
        items: items.filter((i) => i.productId !== productId),
        removingIds: removingIds.filter((id) => id !== productId),
      });
    }, delay);
  },

  clear: () => set({ items: [], removingIds: [] }),
}));
