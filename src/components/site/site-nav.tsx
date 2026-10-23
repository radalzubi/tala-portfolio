"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export const NAV_ITEMS = [
  { href: "/work", label: "Work" },
  { href: "/research/cairo", label: "Research" },
  { href: "/about", label: "About" },
] as const;

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-5 md:gap-7">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("link-quiet py-1 text-sm font-medium text-ink", active && "border-b-ink")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
