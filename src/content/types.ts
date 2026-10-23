/**
 * Shared content contract. Every public record traces back to a source file and physical page.
 * Private source paths never appear here; media is addressed by stable IDs resolved through
 * `media.generated.json` (built by scripts/build_media.py from data/source-manifest.json).
 */

export type SourceFile = "portfolio" | "dissertation";

export interface SourceRef {
  file: SourceFile;
  /** One-based physical PDF page. */
  page: number;
  /** Dissertation figure number where applicable. */
  figure?: number;
  note?: string;
}

export type Provenance =
  | "original" // supplied artwork shown whole
  | "derivative" // crop or faithful web derivative of supplied artwork
  | "interpretive-3d" // reconstruction based on specified sources
  | "concept-visualisation" // made only from a written description
  | "third-party"; // reference material by someone else

export type MediaKind =
  | "render"
  | "drawing"
  | "plan"
  | "section"
  | "axonometric"
  | "detail-drawing"
  | "model-photo"
  | "site-photo"
  | "collage"
  | "diagram"
  | "poster";

export interface MediaVariant {
  src: string;
  width: number;
  height: number;
  format: "jpg" | "webp" | "avif" | "png" | "svg";
}

export interface MediaAsset {
  id: string;
  alt: string;
  caption: string;
  /** Credit line shown with the image, e.g. "Tala Hagras — portfolio, p.11". */
  credit: string;
  provenance: Provenance;
  kind: MediaKind;
  source: SourceRef;
  /** Native pixel size of the source raster (or of the crop region). */
  native: [number, number];
  /** True when the native width is below ~700 px; the UI caps display size. */
  lowResolution: boolean;
  variants: MediaVariant[];
  /** Tiny inline placeholder (data URI) for poster-first loading. */
  placeholder?: string;
  /** Average colour for the frame behind the image while it loads. */
  tone: string;
  /** Rights note when the image contains anything not drawn or made by Tala. */
  rightsNote?: string;
}

export type MediaSize = "full" | "wide" | "half" | "third" | "strip";

export interface MediaPlacement {
  id: string;
  size?: MediaSize;
  /** Optional caption override for a specific placement. */
  caption?: string;
}

export interface ProjectSection {
  id: string;
  heading: string;
  /** Short editorial paragraphs; British English. */
  body: string[];
  media: MediaPlacement[];
  sourceRefs: SourceRef[];
}

export type ModelKind = "original" | "interpretive" | "conceptual" | "none";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  /** Vertical field of view in degrees; a narrow fov from far away gives a near-orthographic read. */
  fov?: number;
}

export interface ViewPreset {
  id: string;
  label: string;
  description: string;
  camera: CameraPreset;
  /** Assembly value this preset implies (0 assembled → 1 separated). */
  assembly?: number;
  /** Drawing paired with this view (media id). */
  drawingId?: string;
  /** Group IDs emphasised in this view (others are faded). */
  emphasis?: string[];
  /** Clipping plane applied to the model for a section view: points with dot(normal, p) + constant < 0 are removed. */
  section?: { normal: [number, number, number]; constant: number };
}

export interface SemanticGroup {
  id: string;
  label: string;
  description: string;
  supportedBy: SourceRef[];
}

export interface Hotspot {
  id: string;
  label: string;
  body: string;
  /** World-space anchor on the model, in model units. */
  anchor: [number, number, number];
  groupId: string;
  sourceRef: SourceRef;
}

export interface ModelSpec {
  kind: ModelKind;
  component: "maison-peplum" | "music-institution";
  /** Short label shown next to the viewer. */
  label: string;
  /** Expanded disclosure note. */
  disclosure: string;
  assumptions: string[];
  basedOn: SourceRef[];
  posterId: string;
  presets: ViewPreset[];
  groups: SemanticGroup[];
  hotspots: Hotspot[];
  assembly?: { label: string; description: string };
  lightStudy?: { label: string; description: string };
  /** Approximate overall extent in model units, used for camera fitting. */
  bounds: { radius: number; center: [number, number, number] };
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  /** Editorial subtitle as written in the portfolio (e.g. "Architecture as Music"). */
  subtitle?: string;
  location: string;
  /** Only verified metadata; omit anything not in the sources. */
  meta: { label: string; value: string; sourceRef: SourceRef }[];
  summary: string;
  themes: string[];
  sourceRefs: SourceRef[];
  heroId: string;
  posterTone: "light" | "dark";
  model?: ModelSpec;
  sections: ProjectSection[];
  publication: { status: "ready" | "needs-content"; needs: string[] };
  /** Order in the work index; lower first. */
  order: number;
}

export type ResearchTheme = "built-form" | "street-life" | "climate-response" | "identity";

export interface AnnotationShape {
  /** Normalised coordinates (0–1) relative to the figure. */
  type: "rect" | "ellipse" | "path";
  /** rect/ellipse: [x, y, w, h]; path: SVG path data in a 0–1 coordinate space. */
  coords: number[] | string;
  label: string;
}

export interface CaseAnnotation {
  mediaId: string;
  theme: ResearchTheme;
  note: string;
  shapes: AnnotationShape[];
  sourceRef: SourceRef;
}

export interface ResearchObservation {
  theme: ResearchTheme;
  text: string;
  sourceRef: SourceRef;
}

export interface ResearchQuote {
  text: string;
  sourceRef: SourceRef;
}

export interface ResearchCase {
  id: "new-administrative-capital" | "zamalek" | "west-el-balad" | "ashwaiyat";
  name: string;
  /** The spatial condition and scale this case represents, in the author's terms. */
  condition: string;
  summary: string;
  observations: ResearchObservation[];
  figures: string[];
  annotations: CaseAnnotation[];
  quotes: ResearchQuote[];
  pages: number[];
}

export interface ResearchChapter {
  title: string;
  subtitle: string;
  editorialLabel: string;
  institution: string;
  wordCount: string;
  abstract: ResearchQuote;
  question: { text: string; sourceRefs: SourceRef[] };
  lenses: { name: string; thinkers: string[]; text: string; sourceRefs: SourceRef[] }[];
  methods: { name: string; text: string; sourceRefs: SourceRef[] }[];
  limitations: ResearchQuote[];
  ethics: ResearchQuote;
  cases: ResearchCase[];
  comparison: { theme: ResearchTheme; label: string; byCase: Record<ResearchCase["id"], string> }[];
  perspectives: { title: string; text: string; sourceRefs: SourceRef[] }[];
  insights: ResearchQuote[];
  conclusion: ResearchQuote;
  bibliography: { text: string; sourceRef: SourceRef }[];
  figureCredits: { figure: number; credit: string; thirdParty: boolean; sourceRef: SourceRef }[];
  download?: { href: string; label: string; note: string };
}
