"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/products", label: "Products", icon: "box" },
  { href: "/shops", label: "Shops", icon: "store" },
  { href: "/earnings", label: "Earnings", icon: "rupee" },
];

// Phones have no user menu in reach, so Settings gets its own tab there.
const BOTTOM_LINKS = [...LINKS, { href: "/settings", label: "Settings", icon: "settings" as IconName }];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="top-nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="top-nav-link" aria-current={isActive(pathname, l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {BOTTOM_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="bottom-nav-link" aria-current={isActive(pathname, l.href) ? "page" : undefined}>
          <Icon name={l.icon} size={20} />
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
