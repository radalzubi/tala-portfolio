/** Primary navigation. Plain module so both server and client components can import it. */
export const NAV_ITEMS = [
  { href: "/work", label: "Work" },
  { href: "/research/cairo", label: "Research" },
  { href: "/about", label: "About" },
] as const;
