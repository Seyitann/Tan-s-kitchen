"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { FlyDetail } from "@/lib/flyToCart";

type Flight = {
  id: number;
  src: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

// Draws the little dish photo that flies to the cart when you tap "Add to cart"
export default function FlyLayer() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    function handleFly(e: Event) {
      const { src, x, y } = (e as CustomEvent<FlyDetail>).detail;
      const target = document
        .getElementById("cart-button")
        ?.getBoundingClientRect();
      if (!target) return;
      nextId.current += 1;
      const flight: Flight = {
        id: nextId.current,
        src,
        x,
        y,
        dx: target.left + target.width / 2 - x,
        dy: target.top + target.height / 2 - y,
      };
      setFlights((current) => [...current, flight]);
    }

    window.addEventListener("cart:fly", handleFly);
    return () => window.removeEventListener("cart:fly", handleFly);
  }, []);

  return (
    <>
      {flights.map((flight) => (
        <motion.div
          key={flight.id}
          aria-hidden="true"
          className="pointer-events-none fixed z-[80] h-14 w-14 rounded-[0.7rem] rounded-tr-[1.4rem] bg-cover bg-center shadow-xl"
          style={{
            left: flight.x - 28,
            top: flight.y - 28,
            backgroundImage: `url(${flight.src})`,
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: [0, flight.dx * 0.55, flight.dx],
            y: [0, -90, flight.dy],
            scale: [1, 0.8, 0.25],
            opacity: [1, 1, 0.2],
          }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
          onAnimationComplete={() =>
            setFlights((current) => current.filter((f) => f.id !== flight.id))
          }
        />
      ))}
    </>
  );
}
