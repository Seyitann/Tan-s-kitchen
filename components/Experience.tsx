import Image from "next/image";
import Link from "next/link";
import { Flame, Users, UtensilsCrossed } from "lucide-react";
import Reveal from "./Reveal";
import { curved, soft } from "./buttonStyles";

const items = [
  {
    icon: UtensilsCrossed,
    title: "Rice dishes",
    text: "Party jollof, fried rice and white rice with garnished stew and chicken.",
  },
  {
    icon: Flame,
    title: "Soups and swallow",
    text: "Amala with ewedu and gbegiri, or egusi with pounded yam, with well-assorted ogufe meat.",
  },
  {
    icon: Users,
    title: "Family deals",
    text: "Big trays for the house, the office or the party.",
  },
];

export default function Experience() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid overflow-hidden md:grid-cols-2">
        <div className="bg-stone-900 p-8 md:p-12">
          <Reveal>
            <p className="text-xs font-bold uppercase italic tracking-widest text-orange-400">
              Experience the food
            </p>
            <div className="mt-8 space-y-6">
              {items.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <Icon className="mt-1 h-8 w-8 shrink-0 text-amber-500" />
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] font-bold uppercase">{title}</h3>
                    <p className="mt-1 text-sm text-stone-300">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/menu"
              className={`${curved} ${soft} mt-8 inline-block px-10 py-3 text-sm font-bold uppercase tracking-wide`}
            >
              Full menu →
            </Link>
          </Reveal>
        </div>

        <div className="relative min-h-[26rem]">
          <Image
            src="/images/suya.jpg"
            alt="Suya grilling over the fire"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <h3 className="font-[family-name:var(--font-heading)] absolute bottom-10 left-6 right-6 text-3xl font-bold uppercase leading-[1.5] md:text-4xl">
            <span className="box-decoration-clone bg-white px-2 text-stone-900">
              Enjoy our original home recipe
            </span>
          </h3>
        </div>
      </div>
    </section>
  );
}
