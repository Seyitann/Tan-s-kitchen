"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { curved, curvedLg, dark, solid } from "./buttonStyles";

const SLIDE_SECONDS = 5;

// "caption" is the dish name shown in the "Now serving" label
const slides = [
  { src: "/images/hero.jpg", alt: "A spread of Nigerian dishes", caption: "A taste of everything" },
  { src: "/images/Jollof-rice.jpg", alt: "Jollof rice", caption: "Jollof rice" },
  { src: "/images/amala.jpg", alt: "Amala with ewedu and gbegiri", caption: "Amala, ewedu & gbegiri" },
  { src: "/images/Pounded-yam.jpg", alt: "Pounded yam and Egusi soup", caption: "Pounded yam and Egusi soup" },
  { src: "/images/suya.jpg", alt: "Suya", caption: "Suya" },
  { src: "/images/white-rice.webp", alt: "White rice and stew", caption: "White rice & stew" },
  { src: "/images/jollof-spaghetti-and-garnished chicken.png", alt: "Jollof spaghetti and garnished chicken", caption: "Jollof spaghetti and garnished chicken" },
  { src: "/images/6cbfb01ec22b9ba66bff84315a5bafbd.jpg", alt: "All types of rice", caption: "Garnished rice" },

];

// Little glowing sparks that drift upward, like embers from the kitchen
const embers = [
  { left: "8%", size: 6, duration: 7, delay: 0 },
  { left: "18%", size: 4, duration: 9, delay: 2 },
  { left: "29%", size: 8, duration: 8, delay: 4 },
  { left: "41%", size: 5, duration: 10, delay: 1 },
  { left: "55%", size: 7, duration: 7.5, delay: 3 },
  { left: "67%", size: 4, duration: 9.5, delay: 5 },
  { left: "78%", size: 6, duration: 8.5, delay: 2.5 },
  { left: "90%", size: 5, duration: 10, delay: 0.5 },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  // Cursor position as a value from -0.5 to 0.5 across the banner
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Cursor position in pixels, used for the soft light
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Springs make the movement ease in and out instead of snapping
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  // Background drifts against the cursor, text drifts with it
  const bgX = useTransform(sx, [-0.5, 0.5], [30, -30]);
  const bgY = useTransform(sy, [-0.5, 0.5], [20, -20]);
  const textX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const textY = useTransform(sy, [-0.5, 0.5], [-8, 8]);

  const spotlight = useMotionTemplate`radial-gradient(350px circle at ${px}px ${py}px, rgba(255,255,255,0.18), transparent 70%)`;

  // Move to the next dish on a timer. Any click on an arrow or dot restarts it.
  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      SLIDE_SECONDS * 1000
    );
    return () => clearTimeout(timer);
  }, [index]);

  function goPrevious() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  function goNext() {
    setIndex((i) => (i + 1) % slides.length);
  }

  function handleMove(e: MouseEvent<HTMLElement>) {
    if (reduceMotion) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    px.set(x);
    py.set(y);
    mx.set(x / box.width - 0.5);
    my.set(y / box.height - 0.5);
  }

  function handleLeave() {
    setHovered(false);
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      className="relative flex h-[78vh] items-center justify-center overflow-hidden bg-stone-900 text-white"
    >
      {/* Blurred dish photos. They sit stacked and fade in and out. */}
      <motion.div
        className="absolute -inset-10"
        style={reduceMotion ? undefined : { x: bgX, y: bgY }}
        animate={{ filter: hovered ? "blur(4px)" : "blur(14px)" }}
        transition={{ duration: 0.6 }}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <motion.div
              key={slide.src}
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: active ? 1 : 0,
                scale: active && !reduceMotion ? 1.15 : 1.05,
              }}
              transition={
                active
                  ? {
                      opacity: { duration: 1.2 },
                      scale: { duration: SLIDE_SECONDS + 1, ease: "linear" },
                    }
                  : {
                      opacity: { duration: 1.2 },
                      scale: { delay: 1.2, duration: 0 },
                    }
              }
            >
              <Image
                src={slide.src}
                alt=""
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Darker edges pull the eye to the middle, and a warm glow rises from the bottom */}
      <div className="absolute inset-0 bg-[image:radial-gradient(ellipse_at_center,rgba(0,0,0,0.35),rgba(0,0,0,0.78))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[image:linear-gradient(to_top,rgba(194,65,12,0.35),transparent)]" />

      {/* Embers drifting upward */}
      {!reduceMotion &&
        embers.map((ember, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 rounded-full bg-amber-300 blur-[2px]"
            style={{ left: ember.left, width: ember.size, height: ember.size }}
            animate={{ y: ["0vh", "-65vh"], opacity: [0, 0.8, 0] }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}

      {/* Soft light that follows the cursor */}
      {!reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlight }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Text */}
      <motion.div
        className="relative px-4 text-center"
        style={reduceMotion ? undefined : { x: textX, y: textY }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-5xl font-bold [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-7xl">
            {["Tan's", "Kitchen"].map((word, i) => (
              <motion.span
                key={word}
                className="mr-4 inline-block last:mr-0"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 14,
                  delay: 0.2 + i * 0.18,
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="mt-4 text-lg tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Fresh Nigerian meals, ordered in minutes.
          </motion.p>
          <motion.div
            className="relative mt-8 inline-block"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
          >
            {/* A ring that keeps pulsing outward to invite a click */}
            {!reduceMotion && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[0.8rem] rounded-tr-[1.6rem] border-2 border-orange-400"
                animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <Link
              href="/menu"
              className={`${curvedLg} ${solid} inline-block px-10 py-3 text-sm font-bold uppercase tracking-wide`}
            >
              Order now
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Previous and next arrows */}
      <button
        type="button"
        onClick={goPrevious}
        aria-label="Previous dish"
        className={`${curved} ${dark} absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center backdrop-blur md:grid`}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next dish"
        className={`${curved} ${dark} absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center backdrop-blur md:grid`}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Name of the dish on screen */}
      <div className="absolute bottom-16 left-6 hidden text-left md:block lg:left-10">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
          Now serving
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="font-heading mt-1 text-xl font-bold"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            {slides[index].caption}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Dots. The active one fills up like a timer until the next dish. */}
      <div className="absolute bottom-12 flex items-center gap-2 md:bottom-16">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${slide.alt}`}
            className={`relative h-2 overflow-hidden rounded-full transition-all ${
              i === index ? "w-10 bg-white/40" : "w-2 bg-white/50"
            }`}
          >
            {i === index && (
              <motion.span
                className="absolute inset-y-0 left-0 bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: SLIDE_SECONDS, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Wavy bottom edge that melts into the amber strip below */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-px left-0 h-10 w-full fill-amber-500 md:h-16"
      >
        <path d="M0,40 C240,80 480,0 720,30 C960,60 1200,70 1440,20 L1440,80 L0,80 Z" />
      </svg>
    </section>
  );
}
