"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { MenuItem } from "@/lib/menuTypes";
import DishCard from "./DishCard";
import { charcoal, curved, solid } from "./buttonStyles";

export default function MenuGrid({ items: menu }: { items: MenuItem[] }) {
  // The filter buttons come from the categories on the menu, in the order they first appear.
  // The owner adds a dish with a new category and its button appears.
  const categories = Array.from(new Set(menu.map((item) => item.category)));
  const filters = ["All", ...categories];

  const [active, setActive] = useState("All");
  const items = active === "All" ? menu : menu.filter((item) => item.category === active);

  if (menu.length === 0) {
    return (
      <p className="py-20 text-center text-stone-400">
        The menu is being updated. Please check back soon.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <motion.button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            whileTap={{ scale: 0.95 }}
            className={`${curved} px-7 py-2.5 text-xs font-extrabold uppercase tracking-wide ${
              filter === active ? solid : charcoal
            }`}
          >
            {filter}
          </motion.button>
        ))}
      </div>

      {/* Dishes slide into their new places when you change the filter */}
      <div className="relative mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
            >
              <DishCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
