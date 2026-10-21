"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { selectCount, selectTotal, useCart } from "@/lib/cart";
import { naira } from "@/lib/format";
import { curved, curvedSm, dark, solid } from "./buttonStyles";

export default function CartDrawer() {
  const isOpen = useCart((state) => state.isOpen);
  const lines = useCart((state) => state.lines);
  const count = useCart(selectCount);
  const total = useCart(selectTotal);
  const close = useCart((state) => state.close);
  const increase = useCart((state) => state.increase);
  const decrease = useCart((state) => state.decrease);
  const remove = useCart((state) => state.remove);
  const clear = useCart((state) => state.clear);

  // While the cart is open: Escape closes it, and the page behind it does not scroll
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        />
      )}
      {isOpen && (
        <motion.aside
          key="panel"
          role="dialog"
          aria-modal="true"
          aria-label="Your cart"
          className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-stone-950 text-stone-100 shadow-2xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
        >
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
              Your cart
              {count > 0 && (
                <span className="ml-2 text-base font-normal text-stone-400">
                  ({count})
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close cart"
              className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-stone-600" />
              <p className="text-stone-300">Your cart is empty.</p>
              <Link
                href="/menu"
                onClick={close}
                className={`${curved} ${solid} px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
              >
                Browse the menu
              </Link>
            </div>
          ) : (
            <ul className="flex-1 space-y-4 overflow-y-auto p-5">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="flex gap-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[0.5rem] rounded-tr-[1.2rem]">
                      {line.image ? (
                        <Image
                          src={line.image}
                          alt={line.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-stone-800" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-snug">
                          {line.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => remove(line.id)}
                          aria-label={`Remove ${line.name}`}
                          className="text-stone-500 transition-colors hover:text-orange-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decrease(line.id)}
                            aria-label={`One less ${line.name}`}
                            className={`${curvedSm} ${dark} grid h-7 w-7 place-items-center`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increase(line.id)}
                            aria-label={`One more ${line.name}`}
                            className={`${curvedSm} ${dark} grid h-7 w-7 place-items-center`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-orange-400">
                          {naira.format(line.price * line.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {lines.length > 0 && (
            <div className="border-t border-white/10 p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-stone-400">Subtotal</span>
                <span className="text-xl font-bold">{naira.format(total)}</span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Delivery fee and the final total are confirmed at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className={`${curved} ${solid} mt-4 block w-full py-3 text-center text-sm font-extrabold uppercase tracking-wide`}
              >
                Checkout
              </Link>
              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full text-center text-xs text-stone-400 transition-colors hover:text-white"
              >
                Clear cart
              </button>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
