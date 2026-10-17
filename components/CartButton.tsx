"use client";

import { ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { selectCount, useCart } from "@/lib/cart";
import { curvedSm, dark } from "./buttonStyles";

export default function CartButton() {
  const count = useCart(selectCount);
  const open = useCart((state) => state.open);

  return (
    <button
      id="cart-button"
      type="button"
      onClick={open}
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
      className={`${curvedSm} ${dark} relative grid h-9 w-9 place-items-center`}
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        // The key changes with the count, so the badge pops each time an item is added
        <motion.span
          key={count}
          initial={{ scale: 1.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
          className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-extrabold text-white"
        >
          {count}
        </motion.span>
      )}
    </button>
  );
}
