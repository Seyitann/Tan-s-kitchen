"use client";

import type { FormEvent } from "react";

export default function Newsletter() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: save the email in Supabase once the database is connected
  }

  return (
    <section className="px-4 py-14">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center">
        <div className="md:w-1/3">
          <p className="font-script text-2xl text-amber-300">Newsletter</p>
          <h2 className="text-2xl font-semibold">Subscribe now!</h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            placeholder="Your email"
            aria-label="Your email"
            className="flex-1 border border-white/20 bg-transparent px-4 py-3 text-sm placeholder:text-stone-400 focus:border-amber-300 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-amber-300 px-8 py-3 text-xs font-bold uppercase tracking-wide text-stone-900 transition hover:bg-amber-200"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
