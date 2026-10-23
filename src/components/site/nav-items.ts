/** Primary navigation, shared by the header (client) and footer (server). Kept out of any "use client" module. */
export const NAV_ITEMS = [
  { href: "/work", label: "Work" },
  { href: "/research/cairo", label: "Research" },
  { href: "/about", label: "About" },
] as const;
