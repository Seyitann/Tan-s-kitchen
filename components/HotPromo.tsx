import Image from "next/image";
import Reveal from "./Reveal";
import { menu } from "@/data/menu";
import type { MenuItem } from "@/data/menu";
import { naira } from "@/lib/format";

// Sample offer. Change the badge, the heading below and the dishes to your real Sunday deal.
const BADGE = "Sunday special";
const picks = ["jollof-chicken", "fried-rice", "white-rice-stew", "beef-suya"];

export default function HotPromo() {
  const items = picks
    .map((id) => menu.find((item) => item.id === id))
    .filter((item): item is MenuItem => Boolean(item));

  return (
    <section className="px-4 py-16 text-center">
      <p className="font-script text-2xl text-amber-300">Hot promo</p>
      <h2 className="mt-1 text-2xl font-semibold md:text-3xl">
        Special offer on Sunday
      </h2>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.1}>
            <div className="relative h-44 overflow-hidden rounded-lg rounded-tr-[3rem]">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 bg-amber-400 px-2 py-1 text-[10px] font-bold uppercase text-stone-900">
                {BADGE}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-semibold">{item.name}</h3>
            <p className="mt-1 font-bold text-amber-300">
              {naira.format(item.price)}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
