import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "@/data/menu";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  hydrated: boolean;
  add: (item: MenuItem) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

// The cart lives here. Any component can read it or change it with useCart().
// persist keeps the lines in the browser, so a refresh does not empty the cart.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hydrated: false,

      add: (item) =>
        set((state) => {
          const existing = state.lines.find((line) => line.id === item.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.id === item.id
                  ? { ...line, quantity: line.quantity + 1 }
                  : line
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: 1,
              },
            ],
          };
        }),

      increase: (id) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.id === id ? { ...line, quantity: line.quantity + 1 } : line
          ),
        })),

      // Going down from 1 removes the dish
      decrease: (id) =>
        set((state) => ({
          lines: state.lines.flatMap((line) => {
            if (line.id !== id) return [line];
            return line.quantity > 1
              ? [{ ...line, quantity: line.quantity - 1 }]
              : [];
          }),
        })),

      remove: (id) =>
        set((state) => ({ lines: state.lines.filter((line) => line.id !== id) })),

      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "tans-kitchen-cart",
      // Only the dishes are saved, not whether the drawer is open
      partialize: (state) => ({ lines: state.lines }),
      // The saved cart is loaded by CartHydrator after the page appears,
      // so the first render matches what the server sent.
      skipHydration: true,
    }
  )
);

export const selectCount = (state: CartState) =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectTotal = (state: CartState) =>
  state.lines.reduce((total, line) => total + line.price * line.quantity, 0);
