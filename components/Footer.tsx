import Link from "next/link";
import { curved, solid } from "./buttonStyles";

export default async function Footer() {
  "use cache";

  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-heading text-lg font-bold text-white">Our location</h3>
          {/* Replace with the real address */}
          <p className="mt-3 text-sm">Your street address, City, State</p>
          <p className="mt-1 text-sm">Phone: your phone number</p>
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold text-white">Quick links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/" className="hover:text-amber-400">Home</Link></li>
            <li><Link href="/#about" className="hover:text-amber-400">About us</Link></li>
            <li><Link href="/menu" className="hover:text-amber-400">Our menu</Link></li>
            <li><Link href="/#contact" className="hover:text-amber-400">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold text-white">Opening hours</h3>
          {/* Replace with the real hours */}
          <p className="mt-3 text-sm">Monday to Saturday: 9:00 AM to 10:00 PM</p>
          <p className="mt-1 text-sm">Sunday: 12:00 PM to 9:00 PM</p>
          <Link
            href="/menu"
            className={`${curved} ${solid} mt-4 inline-block px-8 py-2.5 text-xs font-bold uppercase tracking-wide`}
          >
            Order online
          </Link>
        </div>
      </div>

      <p className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} Tan&apos;s Kitchen. All rights reserved.
      </p>
    </footer>
  );
}
