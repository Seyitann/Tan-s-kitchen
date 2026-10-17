"use client";

import Image from "next/image";
import { useState } from "react";
import type { MouseEvent } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { MenuItem } from "@/data/menu";
import { useCart } from "@/lib/cart";
import { flyToCart } from "@/lib/flyToCart";
import { naira } from "@/lib/format";
import { curved, solid } from "./buttonStyles";

// Each variant has a resting look and a hover look.
// The card passes "hover" down to the parts inside it, so one hover moves everything.
const lift = { rest: { y: 0 }, hover: { y: -8 } };
const zoom = { rest: { scale: 1 }, hover: { scale: 1.1 } };
const shade = { rest: { opacity: 0 }, hover: { opacity: 1 } };
const underline = { rest: { scaleX: 0 }, hover: { scaleX: 1 } };

export default function DishCard({ item }: { item: MenuItem }) {
  const reduceMotion = useReducedMotion();
  const addToCart = useCart((state) => state.add);
  const [added, setAdded] = useState(false);

  function handleAdd(e: MouseEvent<HTMLButtonElement>) {
    addToCart(item);
    // A small copy of the photo flies up to the cart icon
    if (!reduceMotion) {
      flyToCart(item.image, e.currentTarget.getBoundingClientRect());
    }
    // The button says "Added" for a moment
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover={reduceMotion ? undefined : "hover"}
      variants={lift}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-tr-[2rem] transition-shadow duration-300 group-hover:shadow-[0_12px_30px_rgba(234,88,12,0.28)]">
        <motion.div
          variants={zoom}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </motion.div>
        <motion.div
          variants={shade}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
        />
      </div>

      <h3 className="mt-3 text-2xl font-light transition-colors duration-300 group-hover:text-orange-400">
        {item.name}
      </h3>
      <motion.div
        variants={underline}
        style={{ originX: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-1 h-0.5 w-14 bg-amber-500"
      />

      <p className="mt-2 text-sm leading-snug text-stone-300">
        {item.ingredients.join(" / ")}
      </p>

      {item.tags && item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="border border-stone-600 px-2 py-1 text-xs leading-none text-stone-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-base font-semibold">{naira.format(item.price)}</p>

      <motion.button
        type="button"
        onClick={handleAdd}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`${curved} ${solid} mt-3 min-w-[9rem] px-7 py-2.5 text-[11px] font-extrabold uppercase tracking-wide`}
      >
        {added ? (
          <span className="inline-flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            Added
          </span>
        ) : (
          "Add to cart"
        )}
      </motion.button>
    </motion.article>
  );
}
