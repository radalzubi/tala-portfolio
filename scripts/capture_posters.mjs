// Captures still posters of the interpretive 3D studies from the built site, for poster-first loading.
// Usage: npm run build && npx serve out -l 4173 &   then   node scripts/capture_posters.mjs
// Writes data/posters/<id>.png (transparent background, 1600 px wide) which data/source-manifest.json
// references via "sourcePath" with provenance "interpretive-3d". Re-run scripts/build_media.py afterwards.
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const targets = [
  { id: "mp-poster", route: "/work/maison-peplum#view=whole", subject: "Maison Peplum" },
  { id: "mi-poster", route: "/work/music-institution#view=whole", subject: "Music Institution" },
];

mkdirSync(new URL("../data/posters", import.meta.url), { recursive: true });
const preinstalled = ["/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"].find((p) => existsSync(p));
const executablePath = process.env.PW_CHROMIUM ?? preinstalled;
const browser = await chromium.launch({ executablePath, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
for (const t of targets) {
  await page.goto(`${BASE}${t.route}`, { waitUntil: "networkidle" });
  const viewer = page.getByRole("region", { name: new RegExp(`${t.subject}: interactive study`) }).first();
  await viewer.waitFor();
  await page.waitForFunction((el) => el.getAttribute("data-status") === "interactive", await viewer.elementHandle(), { timeout: 30_000 });
  // hide the hotspot markers (the poster is a still of the architecture, not of the UI) and let the camera settle
  const markers = viewer.getByRole("checkbox", { name: /Show markers in 3D/ });
  if ((await markers.count()) > 0 && (await markers.isChecked())) await markers.uncheck();
  await page.waitForTimeout(2500);
  const canvas = viewer.locator("canvas");
  // Read the canvas back with preserveDrawingBuffer off: force a render then capture via toDataURL inside rAF.
  const dataUrl = await canvas.evaluate(async (c) => {
    const el = c;
    return await new Promise((resolve) => {
      requestAnimationFrame(() => {
        // trigger one more frame from the R3F demand loop by dispatching a resize, then read synchronously after it paints
        window.dispatchEvent(new Event("resize"));
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(el.toDataURL("image/png"))));
      });
    });
  });
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  const out = new URL(`../data/posters/${t.id}.png`, import.meta.url);
  const { writeFileSync } = await import("node:fs");
  writeFileSync(out, buf);
  console.log(`wrote ${out.pathname} (${Math.round(buf.length / 1024)} KB)`);
}
await browser.close();
