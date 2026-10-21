import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import Reveal from "./Reveal";
import TiltCard from "./TiltCard";
import { getMenu } from "@/lib/menu";
import { curvedLg, soft } from "./buttonStyles";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

// Shows up to four dishes. The owner picks them with the star in the menu editor.
// With none starred, the first available dishes are shown.
export default async function TopPicks() {
  await connection(); // the menu can change at any time, so this is never saved ahead
  const menu = await getMenu();
  const available = menu.filter((item) => item.available);
  const starred = available.filter((item) => item.featured);
  const items = (starred.length > 0 ? starred : available).slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section id="top-picks" className="scroll-mt-28 bg-stone-900/60 px-4 py-16 text-center">
      <p className="font-semibold text-amber-500">Try our top picks</p>
      <h2 className="font-[family-name:var(--font-heading)] mx-auto mt-2 max-w-2xl text-3xl font-bold md:text-4xl">
        Delicious dishes that will make your taste buds happy!
      </h2>

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.1} className="text-left">
            <TiltCard>
              <div className="group relative h-52 overflow-hidden rounded-tr-[2rem] bg-stone-800">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                )}
              </div>
              <p className="mt-3 text-lg font-bold text-orange-400">
                {naira.format(item.price)}
              </p>
              <h3 className="font-[family-name:var(--font-heading)] mt-1 text-sm font-bold uppercase">
                {item.name}
              </h3>
              <p className="mt-1 text-sm text-stone-400">{item.description}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Link
        href="/menu"
        className={`${curvedLg} ${soft} mt-10 inline-block px-12 py-3 text-sm font-bold uppercase tracking-wide`}
      >
        All specials →
      </Link>
    </section>
  );
}
