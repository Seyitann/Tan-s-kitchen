import Image from "next/image";
import { Soup } from "lucide-react";
import MenuGrid from "@/components/MenuGrid";

export default function MenuPage() {
  return (
    <main>
      <section className="relative flex h-40 items-center justify-center overflow-hidden md:h-48">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <h1 className="relative flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
          <Soup className="h-8 w-8" />
          Our menu
        </h1>
      </section>

      <MenuGrid />
    </main>
  );
}
