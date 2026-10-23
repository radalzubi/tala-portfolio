import type { SourceRef } from "./types";

const d = (page: number, note?: string): SourceRef => ({ file: "dissertation", page, ...(note ? { note } : {}) });
const p = (page: number, note?: string): SourceRef => ({ file: "portfolio", page, ...(note ? { note } : {}) });

/** Only facts present in the supplied sources. No contact details, CV, awards or employment are known. */
export const about = {
  name: "Tala Hagras",
  positioning: "Architecture student working between Cairo and London",
  collection: "Selected architectural works, 2024 — 2026",
  themes: ["Design", "Material", "Movement", "Place"],
  facts: [
    { text: "Egyptian British architecture student who has lived between Cairo and London.", sourceRef: d(5) },
    { text: "Grew up in Cairo, with first-hand experience of historic urban architecture in Zamalek and West el Balad as well as the Ashwa’iyat; studied architecture in the UK.", sourceRef: d(5) },
    { text: "Dissertation, “Homogenisation of Cairo’s Urban Horizons”, submitted at the University of Reading, School of Architecture (2025–26).", sourceRef: d(1, "cover") },
    { text: "Selected works span 2024 to 2026 and are organised around design, material, movement and place.", sourceRef: p(1) },
  ],
  interests: [
    "Material and assembly: timber connection studies, physical model-making and façade systems derived from textiles.",
    "Movement and atmosphere: routes, sections and performance spaces where experience emerges from movement, light, scale and sound.",
    "Place and identity: climate-responsive, context-specific architecture, and the lived experience of cities under pressure to homogenise.",
  ],
  /** Publication dependencies that stay private until supplied (see docs/CONTENT_NEEDED.md). */
  missing: ["contact", "cv"],
} as const;
