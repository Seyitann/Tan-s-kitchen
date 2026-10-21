"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { charcoal, curved, solid } from "./buttonStyles";

const links = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
];

// Switches between the owner's pages
export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2" aria-label="Owner pages">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`${curved} px-6 py-2 text-xs font-extrabold uppercase tracking-wide ${
            pathname === link.href ? solid : charcoal
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
