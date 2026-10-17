import Image from "next/image";
import Reveal from "./Reveal";
import Float from "./Float";

// Sample reviews. Replace them with real ones from your customers.
const reviews = [
  {
    name: "Customer one",
    initials: "C1",
    text: "The jollof was hot and smoky, and the order reached me quickly.",
  },
  {
    name: "Customer two",
    initials: "C2",
    text: "Proper amala with gbegiri and plenty of assorted meat. I will order again.",
  },
  {
    name: "Customer three",
    initials: "C3",
    text: "Easy to order, well packed, and the suya had the right amount of pepper.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden px-4 py-16 text-white">
      <Image
        src="/images/interior.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative mx-auto max-w-6xl text-center">
        <p className="text-sm font-semibold text-amber-500">Testimonials</p>
        <h2 className="font-heading mt-2 text-3xl font-bold md:text-4xl">
          What they say
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal key={review.name} delay={i * 0.12}>
              <Float delay={i * 0.8}>
                <div className="relative rounded-tr-[2rem] bg-amber-500 px-6 pb-6 pt-12">
                  <div className="absolute -top-8 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-white text-sm font-bold text-amber-600">
                    {review.initials}
                  </div>
                  <p className="text-sm leading-relaxed">{review.text}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest">
                    {review.name}
                  </p>
                </div>
              </Float>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
