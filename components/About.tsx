"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Reveal from "./Reveal";
import { curved, solid } from "./buttonStyles";

// Sample copy. Replace it with the truth about your kitchen.
const tabs = [
  {
    name: "Fresh daily",
    text: "Soups and stews are cooked in small batches, so every plate tastes like it just left the pot.",
  },
  {
    name: "Food safety",
    text: "Our kitchen is cleaned through the day, our cooks follow strict hygiene, and every order is packed hot and sealed.",
  },
  {
    name: "Warm space",
    text: "Whether you eat with us or take it home, we want the whole experience to feel welcoming and unhurried.",
  },
];

export default function About() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  // The photo slides slowly inside its frame as you scroll past it
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section id="about" className="scroll-mt-28 px-4 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <Reveal>
          <div
            ref={photoRef}
            className="relative h-80 overflow-hidden md:h-[26rem]"
          >
            <motion.div
              style={reduceMotion ? undefined : { y: photoY }}
              className="absolute inset-x-0 -inset-y-[10%]"
            >
              <Image
                src="/images/interior.jpg"
                alt="Inside Tan's Kitchen"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Why choose us
          </p>
          <h2 className="font-[family-name:var(--font-heading)] mt-2 text-3xl font-bold uppercase leading-tight">
            We always want our customers to be satisfied
          </h2>

          <div className="mt-6 flex gap-5 border-b border-stone-700 text-sm">
            {tabs.map((tab, i) => (
              <button
                key={tab.name}
                onClick={() => setActive(i)}
                className={`-mb-px border-b-2 pb-2 transition ${
                  i === active
                    ? "border-orange-500 font-semibold text-white"
                    : "border-transparent text-stone-400 hover:text-white"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone-300">
            {tabs[active].text}
          </p>

          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-stone-300">
            <li>Hot meals cooked to order</li>
            <li>Simple online ordering</li>
            <li>Friendly, clean service</li>
          </ul>

          <Link
            href="/menu"
            className={`${curved} ${solid} mt-6 inline-block px-10 py-3 text-sm font-bold uppercase tracking-wide`}
          >
            Order now
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
