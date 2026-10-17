"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { curved, curvedSm, dark, ghost, solid } from "./buttonStyles";
import CartButton from "./CartButton";
import AccountButton from "./AccountButton";
import { useSession } from "@/lib/session";

const links = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About us" },
  { href: "/menu", label: "Our menu" },
  { href: "/#top-picks", label: "Today's special" },
  { href: "/#contact", label: "Contact us" },
];

export default function Navbar() {
  const pathname = usePathname();
  // Ordering needs a login, so "Order online" goes to the login page first when nobody is logged in
  const user = useSession((state) => state.user);
  const orderHref = user ? "/menu" : "/login?next=/menu";
  // How far down the page you have scrolled, from 0 to 1
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [open, setOpen] = useState(false);
  // The last link that was clicked, and the page it leads to
  const [clicked, setClicked] = useState<{ href: string; dest: string } | null>(
    null
  );

  // The clicked link is highlighted while you are on the page it leads to.
  // Otherwise the link for the current page is highlighted.
  function isActive(href: string) {
    if (clicked && clicked.dest === pathname) return clicked.href === href;
    return href === pathname;
  }

  function choose(href: string) {
    setClicked({ href, dest: href.split("#")[0] || "/" });
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-amber-500 bg-stone-950/95 text-white shadow-lg backdrop-blur">
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress, originX: 0 }}
        className="absolute -bottom-0.5 left-0 h-0.5 w-full bg-white"
      />
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" onClick={() => choose("/")} className="font-[family-name:var(--font-heading)] text-3xl font-bold">
          Tan&apos;s <span className="text-amber-500">Kitchen</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => choose(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`${curvedSm} block px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
                  isActive(link.href) ? solid : dark
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href={orderHref}
            onClick={() => choose("/menu")}
            className={`${curvedSm} ${ghost} hidden px-5 py-1.5 text-xs font-extrabold uppercase tracking-wide lg:inline-block`}
          >
            Order online
          </Link>

          <CartButton />
          <AccountButton />

          <button
            className={`${curved} ${dark} p-2.5 lg:hidden`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="space-y-2 border-t border-white/10 px-4 pb-5 pt-3 lg:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => choose(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`${curved} block px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide ${
                  isActive(link.href) ? solid : dark
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={orderHref}
              onClick={() => choose("/menu")}
              className={`${curved} ${ghost} block px-5 py-2.5 text-center text-sm font-extrabold uppercase tracking-wide`}
            >
              Order online
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
