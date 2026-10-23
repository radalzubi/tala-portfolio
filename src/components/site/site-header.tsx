import Link from "next/link";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sheet relative z-20 flex items-center justify-between py-5 md:py-6">
      <Link href="/" className="link-quiet font-display text-xl leading-none tracking-tight text-ink">
        Tala Hagras
      </Link>
      <SiteNav />
    </header>
  );
}
