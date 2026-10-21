import { Suspense } from "react";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import TopPicks from "@/components/TopPicks";
import Experience from "@/components/Experience";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <About />
      <Suspense fallback={<section id="top-picks" className="h-96 bg-stone-900/60" />}>
        <TopPicks />
      </Suspense>
      <Experience />
      <Testimonials />
      <Contact />
    </main>
  );
}
