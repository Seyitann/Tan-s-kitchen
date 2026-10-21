import { Suspense } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { Soup } from "lucide-react";
import MenuGrid from "@/components/MenuGrid";
import { getMenu } from "@/lib/menu";

// The menu is read fresh for every visitor, so changes made by the owner show up straight away
async function MenuContent() {
  await connection();
  const items = await getMenu();
  return <MenuGrid items={items} />;
}

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

      <Suspense fallback={<p className="py-20 text-center text-stone-400">Loading the menu...</p>}>
        <MenuContent />
      </Suspense>
    </main>
  );
}
