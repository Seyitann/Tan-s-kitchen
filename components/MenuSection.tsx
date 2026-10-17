import Image from "next/image";
import { Plus } from "lucide-react";
import Reveal from "./Reveal";
import { menu } from "@/data/menu";
import type { MenuItem } from "@/data/menu";
import { naira } from "@/lib/format";

// Shape of each photo tile in the collage
const tiles = [
  "col-span-2 h-52 rounded-tr-[3rem]",
  "h-40 rounded-tl-[3rem]",
  "h-40 rounded-br-[3rem]",
];

export default function MenuSection({
  category,
  title,
  images,
  cardOnLeft,
}: {
  category: MenuItem["category"];
  title: string;
  images: string[];
  cardOnLeft: boolean;
}) {
  const items = menu.filter((item) => item.category === category);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        {/* The white menu card */}
        <Reveal className={cardOnLeft ? "" : "md:order-2"}>
          <div className="bg-white p-8 text-stone-800 shadow-xl">
            <h2 className="font-script text-3xl text-amber-500">{title}</h2>
            <ul className="mt-4">
              {items.map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {item.name}
                    </h3>
                    <span className="flex-1 border-b border-dotted border-stone-300" />
                    <span className="text-sm font-semibold text-amber-600">
                      {naira.format(item.price)}
                    </span>
                    {/* Not wired up yet. It starts adding to the cart in the cart step. */}
                    <button
                      type="button"
                      aria-label={`Add ${item.name} to cart`}
                      className="grid h-6 w-6 shrink-0 place-items-center self-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* The photo collage */}
        <Reveal delay={0.15} className={cardOnLeft ? "" : "md:order-1"}>
          <div className="grid grid-cols-2 gap-3">
            {images.slice(0, 3).map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-lg ${tiles[i]}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
