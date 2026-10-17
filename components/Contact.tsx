"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import Reveal from "./Reveal";
import { curved, solid } from "./buttonStyles";

const field =
  "w-full border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none";

export default function Contact() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: send the message to Supabase once the database is connected
  }

  return (
    <section id="contact" className="scroll-mt-28 px-4 py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="relative mx-auto hidden h-44 w-44 overflow-hidden rounded-full lg:block">
          <Image src="/images/jollof.jpg" alt="" fill sizes="176px" className="object-cover" />
        </div>

        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Get in touch
          </p>
          <h2 className="font-[family-name:var(--font-heading)] mt-2 text-3xl font-bold uppercase">
            Questions or a big order?
          </h2>
          <p className="mt-3 text-sm text-stone-300">
            Planning a party or an office lunch? Drop us a line and we will get
            back to you.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={field} placeholder="Name" aria-label="Name" />
              <input className={field} placeholder="Phone number" aria-label="Phone number" />
            </div>
            <textarea className={field} rows={4} placeholder="Message" aria-label="Message" />
            <button
              type="submit"
              className={`${curved} ${solid} px-10 py-3 text-sm font-bold uppercase tracking-wide`}
            >
              Send message
            </button>
          </form>
        </Reveal>

        <div className="relative mx-auto hidden h-44 w-44 overflow-hidden rounded-full lg:block">
          <Image src="/images/amala.jpg" alt="" fill sizes="176px" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
