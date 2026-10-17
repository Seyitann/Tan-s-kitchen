import Image from "next/image";
import Reveal from "./Reveal";

export default function Ingredients() {
  return (
    <section className="px-4 py-16 text-center">
      <p className="font-script text-2xl text-amber-300">Discover</p>
      <h2 className="mt-1 text-2xl font-semibold md:text-3xl">
        The best ingredients
      </h2>

      <Reveal className="mx-auto mt-8 max-w-4xl">
        <div className="relative h-72 overflow-hidden md:h-96">
          <Image
            src="/images/hero.jpg"
            alt="Fresh ingredients for our dishes"
            fill
            sizes="(min-width: 896px) 896px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
          {/* Sample text. Replace it with the truth about where your ingredients come from. */}
          <p className="absolute inset-x-6 bottom-6 text-left text-sm md:max-w-md">
            Peppers, tomatoes, onions and spices, chosen fresh and cooked the way
            each dish is meant to be made.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
