"use client";

import { motion, useReducedMotion } from "motion/react";

const dishes = [
  "Jollof rice",
  "Fried rice",
  "Egusi soup",
  "Amala & gbegiri",
  "Efo riro",
  "Suya",
  "Puff puff",
  "Chin chin",
];

export default function Marquee() {
  const reduceMotion = useReducedMotion();
  // The list appears twice so the loop never shows a gap
  const items = [...dishes, ...dishes];

  return (
    <div
      className="overflow-hidden bg-amber-500 py-3 text-white"
      aria-hidden="true"
    >
      <motion.div
        className="flex w-max whitespace-nowrap text-lg font-bold uppercase tracking-widest"
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {items.map((dish, i) => (
          <span key={i} className="mr-10 flex items-center gap-10">
            {dish}
            <span className="text-amber-200">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
