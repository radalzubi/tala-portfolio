import type { Metadata, Viewport } from "next";
import type React from "react";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { MotionProvider, motionBootScript } from "@/components/motion/motion-provider";
import { InspectorProvider } from "@/components/media";
import { SkipLink } from "@/components/site/skip-link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://talahagras.com"),
  title: {
    default: "Tala Hagras — Architecture",
    template: "%s — Tala Hagras",
  },
  description:
    "Selected architectural works by Tala Hagras, 2024–2026: Maison Peplum, a music institution in Reading, and research on the homogenisation of Cairo's urban horizons.",
  applicationName: "Tala Hagras — Architecture",
  openGraph: {
    type: "website",
    siteName: "Tala Hagras — Architecture",
    images: [{ url: "/media/mp-poster-1280.jpg", width: 1280, height: 800, alt: "Interpretive 3D study of Maison Peplum" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
          <InspectorProvider>
            <SkipLink />
            <SiteHeader />
            <main id="main" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
          </InspectorProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
