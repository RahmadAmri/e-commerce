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
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  (
    set: (
      partial: Partial<CartState> | ((state: CartState) => Partial<CartState>)
    ) => void
  ) => ({
    items: [],
    addItem: (item: Omit<CartItem, "quantity">, qty = 1) =>
      set((state: CartState) => {
        const existing = state.items.find(
          (i: CartItem) => i.productId === item.productId
        );
        if (existing) {
          return {
            items: state.items.map((i: CartItem) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
          };
        }
        return { items: [...state.items, { ...item, quantity: qty }] };
      }),
    removeItem: (productId: number) =>
      set((s: CartState) => ({
        items: s.items.filter((i: CartItem) => i.productId !== productId),
      })),
    updateQty: (productId: number, qty: number) =>
      set((s: CartState) => ({
        items: s.items.map((i: CartItem) =>
          i.productId === productId ? { ...i, quantity: qty } : i
        ),
      })),
    clear: () => set(() => ({ items: [] })),
  })
);
