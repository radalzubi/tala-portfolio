import type { ModelSpec, Project, SourceRef } from "./types";
import { MUSIC_INSTITUTION_MODEL_DEFAULTS } from "@/components/models/music-institution/spec";

const p = (page: number, note?: string): SourceRef => ({ file: "portfolio", page, ...(note ? { note } : {}) });

/* -------------------------------------------------------------------------------------------------
   Maison Peplum — interpretive model specification. Geometry lives in
   src/components/models/maison-peplum/geometry.ts; assumptions are recorded in docs/RECONSTRUCTION.md.
   Model units are notional metres; the long façades face ±Z and the canal lies at +Z.
------------------------------------------------------------------------------------------------- */
const maisonPeplumModel: ModelSpec = {
  kind: "interpretive",
  component: "maison-peplum",
  label: "Interpretive 3D study based on the portfolio drawings",
  disclosure:
    "This model was built from the plans, section, façade assembly list and model photographs on portfolio pages 8–12. No CAD file or dimensions were supplied, so proportions are read from the drawings and the fin profiles are generated procedurally to match the wave rhythm seen in the 1:200 façade model. It shows massing and the fin system, not a construction-accurate assembly.",
  assumptions: [
    "Overall proportions (length, width, eaves and ridge heights) are scaled from the 1:50 section and the ground plan; no dimensions appear in the source.",
    "The fin count and spacing are chosen to reproduce the rhythm visible in the façade model and renders, not counted from a drawing.",
    "The fins are read as curved timber-coloured sheets; the source names a hanger rib, fin support rib and unistrut connector but does not detail their sizes.",
    "The existing warehouse is modelled as a simple two-storey pitched-roof shell with glazed long façades and a recessed glazed ground floor under cantilevered steel beams, as drawn in the section.",
    "The assembly control separates fins, structure and roof for legibility; it is an interpretive study, not a construction sequence.",
  ],
  basedOn: [p(8, "exterior render"), p(9, "façade model"), p(10, "plans and exploded axonometric"), p(11, "section 1:50 and assembly list"), p(12, "night render and section model")],
  posterId: "mp-poster",
  bounds: { radius: 22, center: [0, 5, 0] },
  presets: [
    {
      id: "whole",
      label: "Whole",
      description: "A calm three-quarter view of the warehouse with its fin façade, seen from the canal.",
      camera: { position: [30, 13, 34], target: [0, 4.5, 0], fov: 30 },
      assembly: 0,
      drawingId: "mp-render-exterior",
    },
    {
      id: "facade",
      label: "Façade rhythm",
      description: "The repeated curved fins read on their own; the shell behind is faded so the peplum rhythm is visible.",
      camera: { position: [8, 6, 31], target: [0, 6.5, 0], fov: 30 },
      assembly: 0,
      emphasis: ["facade-fins"],
      drawingId: "mp-facade-model",
    },
    {
      id: "assembly",
      label: "Assembly",
      description: "An interpretive assembly study: fins lift away from the hanger ribs and the roof lifts off the shell. Scrub the control to reverse it.",
      camera: { position: [28, 19, 30], target: [0, 7, 0], fov: 32 },
      assembly: 1,
      drawingId: "mp-facade-assembly",
    },
    {
      id: "section",
      label: "Section",
      description: "The model cut through its short axis, paired with Tala’s 1:50 section: two floors inside the existing shell, fins on both faces, the canal to one side.",
      camera: { position: [-62, 9, 0.5], target: [0, 5.5, 0], fov: 20 },
      assembly: 0,
      section: { normal: [1, 0, 0], constant: 0 },
      drawingId: "mp-section",
    },
    {
      id: "plan",
      label: "Plan",
      description: "Seen from above, near-orthographic, paired with the ground-floor plan in its canal-side context.",
      camera: { position: [0.01, 110, 0.01], target: [0, 0, 0], fov: 14 },
      assembly: 0,
      drawingId: "mp-plan-ground",
    },
  ],
  groups: [
    { id: "facade-fins", label: "Façade fins", description: "Repeated curved fins over the upper floor and roof, derived from the folds of a peplum jacket.", supportedBy: [p(9), p(11), p(12)] },
    { id: "existing-shell", label: "Existing shell", description: "The retained two-storey warehouse volume with its pitched roof and glazed long façades.", supportedBy: [p(10), p(11)] },
    { id: "structure", label: "Cantilever steel beams", description: "Steel beams carrying the upper floor over the recessed ground floor, as labelled in the section.", supportedBy: [p(11)] },
    { id: "glazed-base", label: "Glazed ground floor", description: "The recessed ground floor beneath the fins, opening the café and showroom to the canal walk.", supportedBy: [p(10), p(11)] },
    { id: "roof", label: "Roof", description: "The pitched roof of the existing shell.", supportedBy: [p(11)] },
    { id: "context", label: "Canal and quay", description: "The canal beside the building, drawn on the plan and section.", supportedBy: [p(10), p(11)] },
  ],
  hotspots: [
    { id: "fins", label: "Curved fins", body: "A repeated system of curved fins gives the building its silhouette; their profile flares at the hem like the peplum jacket in the garment studies.", anchor: [4, 8.6, 7.4], groupId: "facade-fins", sourceRef: p(9) },
    { id: "hem", label: "The hem", body: "At the lower edge the fins flare outward and drop slightly, the fold that the garment deconstruction drawings isolate.", anchor: [-8, 3.9, 7.3], groupId: "facade-fins", sourceRef: p(9) },
    { id: "shell", label: "Existing warehouse", body: "Jupps Warehouse is retained as a brick, steel-framed shell; the section shows existing timber and steel frames behind the new envelope.", anchor: [-15.3, 7.2, 0], groupId: "existing-shell", sourceRef: p(11) },
    { id: "cantilever", label: "Cantilever and recessed base", body: "The upper floor oversails a recessed glazed ground floor on cantilevered steel beams with cross bracing.", anchor: [6, 3.3, 5.9], groupId: "structure", sourceRef: p(11) },
    { id: "canal", label: "Canal edge", body: "The building sits beside the canal; the plan shows the quay and moorings along this side.", anchor: [0, 0.3, 12.5], groupId: "context", sourceRef: p(10) },
  ],
  assembly: { label: "Fold / assembly", description: "0% assembled → 100% separated. Moves the fin groups and the roof apart; an interpretive study of the envelope layers, not a construction sequence." },
  lightStudy: { label: "Light study", description: "Illustrative lighting from morning to evening. Not a solar simulation." },
};

/* -------------------------------------------------------------------------------------------------
   Music institution — interpretive model specification.
------------------------------------------------------------------------------------------------- */
const mi = MUSIC_INSTITUTION_MODEL_DEFAULTS;
const musicInstitutionModel: ModelSpec = {
  kind: "interpretive",
  component: "music-institution",
  label: "Interpretive 3D study based on the portfolio drawings",
  disclosure:
    "Built from the site plan, section, exploded axonometric and renders on portfolio pages 3–7. The drum, its stepped hall, the mezzanine, the roof garden with its skylight and the terraces to the canal are modelled to the level those drawings support. Interiors beyond the section and axonometric are not modelled.",
  assumptions: [
    "Scale is proportional: the drum diameter and storey heights are read from the section and axonometric; no dimensions are stated.",
    "The outdoor terraces follow the curved bands on the site plan; their exact number of steps is not drawn.",
    "The timber-slatted annexe and the curved outdoor performance screen are taken from the render and axonometric; their construction is not detailed in the source.",
    "The section view cuts the model through the centre of the hall; the paired drawing is Tala’s own section, which remains the authoritative description of the interior.",
  ],
  basedOn: [p(4, "site plan"), p(5, "section and exploded axonometric"), p(7, "renders and model photographs")],
  posterId: "mi-poster",
  bounds: mi.bounds,
  presets: mi.presets.map((preset) => ({
    ...preset,
    drawingId: preset.id === "section" ? "mi-section" : preset.id === "plan" ? "mi-site-plan" : preset.id === "assembly" ? "mi-exploded-axo" : preset.id === "route" ? "mi-site-plan" : "mi-render-exterior",
  })),
  groups: [
    { id: "performance-volume", label: "Performance space", description: "The circular, double-height hall with stepped seating at the heart of the plan.", supportedBy: [p(4), p(5)] },
    { id: "ring-ground", label: "Ground-floor ring", description: "Recording studio, entrance, kitchen and services arranged around the hall.", supportedBy: [p(5, "exploded axonometric")] },
    { id: "ring-upper", label: "Upper ring", description: "A mezzanine round hall above the performance space with practice music and dance rooms.", supportedBy: [p(5, "exploded axonometric")] },
    { id: "roof", label: "Roof garden and skylight", description: "A planted roof with a central skylight over the hall.", supportedBy: [p(5)] },
    { id: "landscape", label: "Stepped landscape", description: "Curved outdoor stepped seating descending from the building to the canal edge.", supportedBy: [p(4), p(5)] },
    { id: "outdoor-stage", label: "Outdoor performance", description: "Outdoor performance areas and a slatted screen in the landscape.", supportedBy: [p(4), p(5)] },
  ],
  hotspots: [
    { id: "hall", label: "Circular performance space", body: "A double-height hall with stepped seating anchors the plan; the section labels it SU02–SU03.", anchor: mi.hotspotAnchors["performance-hall"], groupId: "performance-volume", sourceRef: p(5) },
    { id: "mezzanine", label: "Mezzanine", body: "A round mezzanine hallway overlooks the performance space, linking practice rooms on the upper ring.", anchor: mi.hotspotAnchors["mezzanine"], groupId: "ring-upper", sourceRef: p(5) },
    { id: "roof-garden", label: "Roof garden and skylight", body: "The section shows an extensive green roof build-up; the axonometric labels a rooftop garden and a central skylight.", anchor: mi.hotspotAnchors["roof-garden"], groupId: "roof", sourceRef: p(5) },
    { id: "terraces", label: "Stepped landscape", body: "Landscaped, stepped routes connect the city to the canal, with the canal edge becoming a space for gathering, movement and performance.", anchor: mi.hotspotAnchors["terraces"], groupId: "landscape", sourceRef: p(4) },
    { id: "stage", label: "Outdoor performance area", body: "Curved screens and outdoor performance areas sit in the landscape beside the building.", anchor: mi.hotspotAnchors["outdoor-stage"], groupId: "outdoor-stage", sourceRef: p(5) },
  ],
  assembly: { label: "Reveal", description: "0% assembled → 100% separated. Lifts the roof and upper ring as in Tala’s exploded axonometric so the hall and its seating can be read." },
};

/* -------------------------------------------------------------------------------------------------
   Projects
------------------------------------------------------------------------------------------------- */
export const projects: Project[] = [
  {
    id: "maison-peplum",
    slug: "maison-peplum",
    title: "Maison Peplum",
    subtitle: "Adaptive reuse",
    location: "Jupps Warehouse, Brentford, London",
    meta: [
      { label: "Site", value: "Jupps Warehouse, Brentford, London", sourceRef: p(8) },
      { label: "Type", value: "Adaptive reuse — making, exhibition and community use", sourceRef: p(8) },
      { label: "Programme", value: "Café, outlet and showroom, principal studios, haberdashery and textiles supplies, offices, storage", sourceRef: p(10) },
      { label: "Status", value: "Academic design project", sourceRef: p(1) },
    ],
    summary:
      "A textile-led architectural response to Jupps Warehouse. The movement and folds of the peplum jacket inform a sculptural façade of repeated curved fins over the existing warehouse, while the building supports making, exhibition and community use.",
    themes: ["Material", "Movement"],
    sourceRefs: [p(8), p(9), p(10), p(11), p(12)],
    heroId: "mp-render-exterior",
    posterTone: "light",
    model: maisonPeplumModel,
    order: 1,
    publication: {
      status: "needs-content",
      needs: ["Higher-resolution exports of the renders, plans, section and model photographs (supplied rasters are 358–687 px wide)", "Source CAD or 3D model for a faithful reconstruction"],
    },
    sections: [
      {
        id: "question",
        heading: "The design question",
        body: [
          "How can a garment’s construction become a building’s envelope? The project begins with the peplum jacket: a fitted body with a flared, folded hem. Deconstruction drawings isolate the hem, the pleat and the seam, and ask what each would do at the scale of a warehouse façade.",
          "Tala’s initial response looked at the neoclassical period in which the peplum jacket was created, with its focus on geometry, symmetry and linear lines, alongside the steel frame of Jupps Warehouse. Over time the tectonic studies moved towards organic, flowing movement, replicating the folds of the jacket, and a clay study opened the way to the parametric façade adopted for the building.",
        ],
        media: [
          { id: "mp-concept-corner", size: "third" },
          { id: "mp-concept-wall-study", size: "third" },
          { id: "mp-concept-street-study", size: "third" },
          { id: "mp-pattern-drafts", size: "third" },
        ],
        sourceRefs: [p(8), p(9)],
      },
      {
        id: "form",
        heading: "Garment to building",
        body: [
          "A repeated system of curved fins gives the building its distinctive silhouette. Physical studies trace the translation: a gridded card-and-timber tectonic model with folded canopies, clay studies of fabric in motion, and a 1:200 model in which rows of wave-profiled fins wrap the warehouse like a hem.",
        ],
        media: [
          { id: "mp-tectonic-lattice", size: "third" },
          { id: "mp-tectonic-lattice-corner", size: "third" },
          { id: "mp-clay-slab", size: "third" },
          { id: "mp-clay-folds", size: "third" },
          { id: "mp-facade-model", size: "wide" },
          { id: "mp-facade-model-long", size: "third" },
        ],
        sourceRefs: [p(9)],
      },
      {
        id: "plan",
        heading: "Plan, programme and context",
        body: [
          "The warehouse sits on a narrow site between a canal and the surrounding streets of Brentford. The ground plan opens a café, an outlet and showroom and washrooms towards the water; principal studios, haberdashery and textile supplies, offices and storage are arranged across the two floors. The exploded axonometric separates roof, upper floor, ground floor and site to show how the programme stacks within the retained shell.",
        ],
        media: [
          { id: "mp-plan-ground", size: "half" },
          { id: "mp-plan-roof", size: "half" },
          { id: "mp-exploded-axo", size: "wide" },
        ],
        sourceRefs: [p(10)],
      },
      {
        id: "section",
        heading: "Section, envelope and structure",
        body: [
          "The 1:50 section presents spatial experience and construction logic together. Inside the existing brick, steel-framed shell two floors are connected by a timber stair; the fins rise on both faces and over the roof; the upper floor is carried on cantilevered steel beams with cross bracing above a recessed, glazed ground floor that meets the canal walk.",
          "The façade assembly is listed from the inside out — unistrut connector, hanger rib, fin support rib, the fins themselves, screen brackets, glazing wall frame and spandrels, cantilever steel beam, mullions and transoms, and cross-braced steel frames — and a wall build-up detail shows the existing timber and steel frames, insulation, CLT and brick cladding, the hanging rib and support panel, spacer and ventilation gap.",
        ],
        media: [
          { id: "mp-section", size: "wide" },
          { id: "mp-facade-assembly", size: "half" },
          { id: "mp-wall-detail", size: "half" },
          { id: "mp-facade-detail-fixing", size: "third" },
          { id: "mp-fin-panel-study", size: "third" },
        ],
        sourceRefs: [p(11)],
      },
      {
        id: "atmosphere",
        heading: "The building, light and model",
        body: [
          "At night the fins read as a lantern: the glazed floors behind them glow through the timber rhythm. Inside, the showroom opens under the folded ceiling of the fins. A 1:50 section model and the 1:200 façade model record how the pleated envelope meets the warehouse.",
        ],
        media: [
          { id: "mp-render-night", size: "wide" },
          { id: "mp-render-interior", size: "half" },
          { id: "mp-model-section", size: "half" },
          { id: "mp-model-section-side", size: "third" },
        ],
        sourceRefs: [p(12)],
      },
    ],
  },
  {
    id: "music-institution",
    slug: "music-institution",
    title: "Music Institution",
    subtitle: "Architecture as Music",
    location: "Reading, UK",
    meta: [
      { label: "Site", value: "Reading, UK — a canal-side site", sourceRef: p(3) },
      { label: "Type", value: "Music institution with a circular performance space", sourceRef: p(3) },
      { label: "Spaces", value: "Recording studios, double-height performance space with stepped seating, café, mezzanine, practice music and dance rooms, rooftop garden", sourceRef: p(5) },
      { label: "Status", value: "Academic design project", sourceRef: p(1) },
    ],
    summary:
      "A music institution conceived as an architecture of rhythm, resonance and movement. A circular performance space anchors the project while landscaped routes connect the city to the canal.",
    themes: ["Movement", "Place"],
    sourceRefs: [p(3), p(4), p(5), p(6), p(7)],
    heroId: "mi-render-exterior",
    posterTone: "dark",
    model: musicInstitutionModel,
    order: 2,
    publication: {
      status: "needs-content",
      needs: ["Confirmation of authorship for the site photographs in the site analysis collage (p.4)", "Source CAD or 3D model for a faithful reconstruction"],
    },
    sections: [
      {
        id: "concept",
        heading: "Concept and atmosphere",
        body: [
          "The design statement sets the building out as an instrument: rhythm in the repetition of its structure, resonance in the circular hall, movement in the routes that pass through and around it. The circular performance space anchors the project while landscaped routes connect the city to the canal.",
        ],
        media: [
          { id: "mi-render-exterior", size: "wide" },
          { id: "mi-concept-axo", size: "third" },
          { id: "mi-concept-flow", size: "third" },
        ],
        sourceRefs: [p(3)],
      },
      {
        id: "site",
        heading: "Reading the site: public realm",
        body: [
          "The building is positioned within a stepped landscape, with the canal edge becoming a space for gathering, movement and performance. The site plan places the drum at the north-east of the site and sweeps curved, stepped terraces from it down to the water, with outdoor performance areas and planted circles set among the trees.",
        ],
        media: [
          { id: "mi-site-plan", size: "full" },
          { id: "mi-site-analysis", size: "wide" },
        ],
        sourceRefs: [p(4)],
      },
      {
        id: "section",
        heading: "Section: movement and levels",
        body: [
          "A continuous spatial sequence links practice, performance and the public landscape. The section cuts through recording studios, the double-height performance space with its stepped seating, the café and the mezzanine hallway, under an extensive green roof; outside, the stepped seating continues down towards the canal. Its construction legend (CT01–CT20) records CLT panels, acoustic panelling, sound and thermal layers, the green-roof build-up and the ground slab.",
          "The exploded axonometric separates the ground ring (entrance and registry, recording studio, kitchen, bathroom), the upper ring (mezzanine round hall, practice music and dance rooms) and the rooftop garden with its skylight.",
        ],
        media: [
          { id: "mi-section", size: "full" },
          { id: "mi-section-hall", size: "half" },
          { id: "mi-section-legend", size: "third" },
          { id: "mi-exploded-axo", size: "full" },
        ],
        sourceRefs: [p(5)],
      },
      {
        id: "material",
        heading: "Material, assembly and technical study",
        body: [
          "Structural thinking, timber connection studies and physical model-making are presented as essential evidence of design development. The material study proposes reusing reclaimed glulam, with the ABBA Arena cited as a precedent; timber connection details and a 1:20 tectonic model work out the joints, and a 1:200 site model and a section model test the whole.",
        ],
        media: [
          { id: "mi-timber-details", size: "wide" },
          { id: "mi-timber-column-study", size: "third" },
          { id: "mi-tectonic-model", size: "third" },
          { id: "mi-site-model-wide", size: "half" },
          { id: "mi-site-model-above", size: "third" },
          { id: "mi-section-model", size: "third" },
        ],
        sourceRefs: [p(6)],
      },
      {
        id: "atmosphere",
        heading: "Architectural atmosphere",
        body: [
          "Theatrical experience is not an effect added to the project: it emerges from movement, light, scale and the shared experience of sound. The renders show the drum at dusk above the terraces and the water, and the hall inside lit from its skylight.",
        ],
        media: [{ id: "mi-render-interior", size: "wide" }],
        sourceRefs: [p(7)],
      },
    ],
  },
  {
    id: "sound-aroma-loom",
    slug: "sound-aroma-loom",
    title: "Sound Aroma Loom",
    subtitle: "Sensory pavilion",
    location: "Whitechapel Market, London",
    meta: [
      { label: "Site", value: "Whitechapel Market, London", sourceRef: p(13) },
      { label: "Type", value: "Experimental sensory pavilion", sourceRef: p(13) },
      { label: "Status", value: "Academic design project — original artwork not yet supplied", sourceRef: p(13) },
    ],
    summary:
      "An experimental pavilion exploring the relationship between sound, aroma, textile and urban experience at Whitechapel Market. Its flower-like chimneys, linen curtains and rainwater strategy form a sensory architectural language.",
    themes: ["Material", "Place"],
    sourceRefs: [p(13), p(14), p(15), p(16)],
    heroId: "sal-sensory-diagram",
    posterTone: "light",
    order: 3,
    publication: {
      status: "needs-content",
      needs: [
        "Original DS5 artwork: final pavilion visual, Whitechapel site / sensory map, concept studies, sound and scent diagram, plan and section, linen and chimney detail, flower-chimney model, pavilion atmosphere view",
      ],
    },
    sections: [
      {
        id: "description",
        heading: "What the project explores",
        body: [
          "The pavilion relates sound, aroma, textile and urban experience at Whitechapel Market. Flower-like chimneys draw air and scent through the structure, linen curtains filter light and sound, and a rainwater strategy ties the pavilion to the weather of the market.",
          "The portfolio preview describes the project in four parts — the final pavilion, urban senses and concept development, plan, section and material, and detail, atmosphere and making — but its original drawings have not yet been supplied. This entry is text-led until they are.",
        ],
        media: [],
        sourceRefs: [p(13), p(14), p(15), p(16)],
      },
    ],
  },
];

export const projectsByOrder = [...projects].sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((pr) => pr.slug === slug);
}

export function nextProject(slug: string): Project | undefined {
  const i = projectsByOrder.findIndex((pr) => pr.slug === slug);
  if (i < 0) return undefined;
  return projectsByOrder[(i + 1) % projectsByOrder.length];
}
