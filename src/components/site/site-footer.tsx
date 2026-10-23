import Link from "next/link";
import { MotionSetting } from "@/components/motion/motion-setting";
import { NAV_ITEMS } from "@/content/nav";

export function SiteFooter() {
  return (
    <footer className="sheet mt-24 pb-12 pt-10 rule-t">
      <div className="sheet-grid items-start">
        <div className="col-span-4 md:col-span-4 lg:col-span-5">
          <p className="font-display text-xl leading-tight">Tala Hagras</p>
          <p className="mt-1 text-sm text-ink-2">Selected architectural works, 2024 — 2026</p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-2">
            Projects are academic design proposals. Three-dimensional studies on this site are interpretive
            reconstructions from the portfolio drawings and are labelled as such beside each viewer.
          </p>
        </div>
        <div className="col-span-2 md:col-span-2 lg:col-span-3">
          <p className="meta meta-strong mb-3">Index</p>
          <ul className="space-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-quiet">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/work/maison-peplum" className="link-quiet">
                Maison Peplum
              </Link>
            </li>
            <li>
              <Link href="/work/music-institution" className="link-quiet">
                Music Institution
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-2 lg:col-span-4">
          <p className="meta meta-strong mb-3">Settings</p>
          <MotionSetting />
        </div>
      </div>
      <p className="meta mt-12">
        Sources: portfolio preview (17 pages) and dissertation “Homogenisation of Cairo’s Urban Horizons” (2025–26).
        Page references are physical PDF pages.
      </p>
    </footer>
  );
}
