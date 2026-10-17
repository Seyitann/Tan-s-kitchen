import Image from "next/image";
import type { MenuItem } from "@/data/menu";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-48">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold">{naira.format(item.price)}</span>
          <button className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}