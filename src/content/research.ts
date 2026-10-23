import type { ResearchChapter, SourceRef } from "./types";

const d = (page: number, note?: string): SourceRef => ({ file: "dissertation", page, ...(note ? { note } : {}) });

/**
 * Cairo research chapter. Every statement is paraphrased from, or quoted verbatim from, the
 * dissertation "Homogenisation of Cairo's Urban Horizons" (physical page numbers). The conclusions are
 * the author's qualitative analysis; there are no scores, measurements or geographic data in the source.
 */
export const cairoResearch: ResearchChapter = {
  title: "Homogenisation of Cairo’s Urban Horizons",
  subtitle: "Cultural Identity, Lived Experience, and Contemporary Urban Practice",
  editorialLabel: "Beyond the Generic City",
  institution: "University of Reading, School of Architecture",
  wordCount: "5,039",
  abstract: {
    text: "This dissertation investigates how the growing homogenisation of the contemporary built environment of Cairo impacts its own architectural identity. Through a mix of different methods like a literature review, analytical urban drawings, critical observation, and semi structured interviews with practicing architects in Egypt, this research examines how homogenisation rises across multiple urban scales and how architects and communities deal with these pressures in practice.",
    sourceRef: d(1, "abstract"),
  },
  question: {
    text: "Is the future of Cairo’s architectural identity at risk, and how does it depend on balancing contemporary development with culture and context-responsive design? The dissertation treats homogenisation not simply as a style but as a social and spatial process shaped by economic pressure, government decisions and developers’ priorities.",
    sourceRefs: [d(4), d(5)],
  },
  lenses: [
    {
      name: "Globalisation and the Generic City",
      thinkers: ["Koolhaas", "Sassen", "King"],
      text: "Koolhaas’s Generic City describes urban environments that become detached from history, identity and site-specific context, prioritising efficiency, flexibility and scale. Sassen reads cities as nodes in global financial networks where architecture attracts investment, and King shows how models made in dominant cities are replicated elsewhere with little amendment to local culture or climate.",
      sourceRefs: [d(6), d(7)],
    },
    {
      name: "Critical regionalism",
      thinkers: ["Frampton"],
      text: "Frampton’s critical regionalism does not reject modernity but asks architecture to answer climate, topography, materiality and cultural context. The dissertation uses it as a lens for whether recent developments in Cairo respond purposefully to place or simply adopt generic global design.",
      sourceRefs: [d(7), d(8)],
    },
    {
      name: "Phenomenology of place",
      thinkers: ["Norberg-Schulz", "Pallasmaa", "Zumthor"],
      text: "Through genius loci, multisensory design and material presence, phenomenology reframes homogenisation as an experience of how spaces are felt, occupied and remembered, so that architectural identity is read as constantly changing rather than fixed.",
      sourceRefs: [d(8)],
    },
    {
      name: "Egyptian perspectives",
      thinkers: ["Hassan Fathy", "Walid Arafa"],
      text: "Fathy’s climate-responsive, community-led architecture and Arafa’s combination of contemporary design with culture show architectural identity in Egypt as something that has always changed through needs, environment and community life rather than global trends.",
      sourceRefs: [d(8), d(9)],
    },
  ],
  methods: [
    {
      name: "Comparative case studies across scales",
      text: "Large-scale, state- and developer-led expansion (the New Administrative Capital); central districts carrying historic urban memory under contemporary pressure (Zamalek and West el Balad); and informal neighbourhoods that have grown organically through community-driven adaptation (Ashwa’iyat). The cases embody contrasting conditions: planned versus organic, formal versus informal, international versus local.",
      sourceRefs: [d(9)],
    },
    {
      name: "Analytical urban drawings and observation",
      text: "Mapping, sectional studies and diagrammatic analysis of urban forms, circulation, material presence and relationships, curated from direct observation and photographic documentation. Observation concentrated on street life, transitions between public and private space, climatic response and detailing.",
      sourceRefs: [d(10)],
    },
    {
      name: "Semi-structured interviews",
      text: "Interviews with practising architects working in the Cairo context, transcribed and analysed for patterns relating to market and development, climate responsiveness, adaptive reuse, public life and informal urban architecture.",
      sourceRefs: [d(10)],
    },
  ],
  limitations: [
    { text: "The research is limited by the number of interviews conducted.", sourceRef: d(11) },
    { text: "Translation from Arabic to English may lose depth and intensity of meaning, and one interview was conducted by e-mail without discussion.", sourceRef: d(11) },
    { text: "The selected case studies provide depth but do not represent all urban conditions within Greater Cairo, and time limited the extent of on-site observation.", sourceRef: d(11) },
  ],
  ethics: {
    text: "The research followed the University of Reading’s ethical guidelines. Interviewees gave informed consent and chose to be named; drawings focused on public environments and architecture and avoided including individuals.",
    sourceRef: d(11),
  },
  cases: [
    {
      id: "new-administrative-capital",
      name: "New Administrative Capital",
      condition: "Large-scale, state-led and developer-driven expansion — a new city of wide boulevards, isolated buildings and government districts.",
      summary:
        "The New Administrative Capital is read as the clearest example of generic homogenisation: a symbol of progress built from glass façades, neutral material schemes and repetitive office and residential blocks that resemble districts in London, Dubai or New York. The drawings show a spatial logic that prioritises vehicle movement over pedestrians, visual symmetry over social environments and spatial organisation over human engagement.",
      observations: [
        { theme: "built-form", text: "Most buildings are near-identical: glass façades, neutral palettes and generic office and residential blocks.", sourceRef: d(13) },
        { theme: "street-life", text: "Little or no public space, there mainly for show rather than as a social environment — unlike the always-busy street life of the rest of Cairo.", sourceRef: d(14) },
        { theme: "climate-response", text: "The adopted style is not made for Cairo’s climate; it relies on mechanical cooling instead of shading, courtyards and thick walls.", sourceRef: d(13) },
        { theme: "identity", text: "A core example of Koolhaas’s Generic City: identity is replaced by bigger, modern designs detached from site specificity.", sourceRef: d(14) },
      ],
      figures: ["cx-fig-01", "cx-fig-02", "cx-fig-03"],
      annotations: [
        {
          mediaId: "cx-fig-01",
          theme: "built-form",
          note: "Isolated towers and a dominant landmark read against an empty, horizontal foreground: the skyline is composed for the distant view rather than the street.",
          shapes: [
            { type: "rect", coords: [0.395, 0.088, 0.08, 0.769], label: "Landmark tower" },
            { type: "rect", coords: [0.58, 0.484, 0.34, 0.374], label: "Repeated residential blocks" },
            { type: "rect", coords: [0.02, 0.857, 0.96, 0.132], label: "Empty, horizontal foreground" },
          ],
          sourceRef: d(12),
        },
        {
          mediaId: "cx-fig-02",
          theme: "street-life",
          note: "The grand entrance is scaled to the boulevard and the vehicle, not to the pedestrian.",
          shapes: [
            { type: "rect", coords: [0, 0.229, 0.35, 0.4], label: "Colonnade" },
            { type: "rect", coords: [0.72, 0.143, 0.28, 0.543], label: "Colonnade" },
            { type: "rect", coords: [0, 0.6, 1.0, 0.4], label: "Boulevard width: the pedestrian is absent" },
          ],
          sourceRef: d(13),
        },
        {
          mediaId: "cx-fig-03",
          theme: "built-form",
          note: "Linear, generic formal façades: the outline of building shape and size repeats along the street.",
          shapes: [
            { type: "rect", coords: [0.2, 0.04, 0.63, 0.16], label: "Oversized canopy" },
            { type: "rect", coords: [0, 0.32, 0.26, 0.58], label: "Flanking block" },
            { type: "rect", coords: [0.78, 0.33, 0.22, 0.57], label: "Flanking block" },
          ],
          sourceRef: d(13),
        },
        {
          mediaId: "cx-fig-02",
          theme: "climate-response",
          note: "Sealed, mechanically cooled blocks and an open plaza without shade: none of the shading, courtyards or thick walls of Egyptian architecture.",
          shapes: [
            { type: "rect", coords: [0.32, 0.114, 0.16, 0.514], label: "Sealed glass tower" },
            { type: "rect", coords: [0, 0.629, 1.0, 0.371], label: "Unshaded plaza" },
          ],
          sourceRef: d(13),
        },
        {
          mediaId: "cx-fig-01",
          theme: "identity",
          note: "A skyline modelled on the benchmarks of Dubai, London and New York: the Generic City, detached from site specificity.",
          shapes: [
            { type: "rect", coords: [0.14, 0.505, 0.19, 0.352], label: "Towers that could stand anywhere" },
            { type: "rect", coords: [0.84, 0.484, 0.08, 0.374], label: "Towers that could stand anywhere" },
          ],
          sourceRef: d(12),
        },
      ],
      quotes: [
        { text: "Most buildings within the New Capital are identical, more or less.", sourceRef: d(13) },
        { text: "The New Administrative Capital is a core example of Koolhaas’s Generic City, identity there is replaced by bigger and modern designs while their architecture becomes detached from site specificity.", sourceRef: d(14) },
      ],
      pages: [12, 13, 14],
    },
    {
      id: "zamalek",
      name: "Zamalek",
      condition: "A historic central district — dense, mixed-use streets whose façades and balconies were shaped by everyday social life.",
      summary:
        "Zamalek, with West el Balad, is loved for its depth of architectural significance: dense, busy streets, mixed uses and façade detailing shaped by everyday social interaction. Today residential buildings are slowly converting to commercial use and façade renovations replace original detailing with generic finishes — a slower, incremental homogenisation driven by commercial return rather than intentional erasure.",
      observations: [
        { theme: "built-form", text: "Historic façades with detailed balconies and ornament; renovations are replacing original detailing with generic finishes.", sourceRef: d(15) },
        { theme: "street-life", text: "Narrow streets and unspoken borders between public and private; residential buildings slowly converting into commercial uses.", sourceRef: d(15) },
        { theme: "climate-response", text: "Shaded sidewalks, balconies and the narrow street section still show how historic architecture worked with climate and social life; modern renovations favour sealed interiors.", sourceRef: d(16) },
        { theme: "identity", text: "A slower form of homogenisation: the district keeps its historic touch while market-led renovation makes those qualities seem less important.", sourceRef: d(24) },
      ],
      figures: ["cx-fig-06", "cx-fig-07a", "cx-fig-07b"],
      annotations: [
        {
          mediaId: "cx-fig-06",
          theme: "built-form",
          note: "Projecting balconies, cornices and the rounded corner bay carry the detail that renovations tend to flatten.",
          shapes: [
            { type: "rect", coords: [0.465, 0.016, 0.302, 0.113], label: "Roof parapet detail" },
            { type: "rect", coords: [0.267, 0.613, 0.407, 0.161], label: "Corner balcony" },
            { type: "rect", coords: [0.07, 0.823, 0.302, 0.177], label: "Ground-floor arcade" },
          ],
          sourceRef: d(15),
        },
        {
          mediaId: "cx-fig-07a",
          theme: "climate-response",
          note: "Looking up between facing buildings: the narrow gap and the structure spanning it keep the street in shade.",
          shapes: [
            { type: "rect", coords: [0.23, 0.128, 0.582, 0.511], label: "Shading structure across the gap" },
          ],
          sourceRef: d(16),
        },
        {
          mediaId: "cx-fig-07b",
          theme: "climate-response",
          note: "Balconies and screens step along the gap between buildings, shading the pavement below.",
          shapes: [
            { type: "rect", coords: [0.032, 0.511, 0.882, 0.444], label: "Balconies and screens over the street" },
          ],
          sourceRef: d(16),
        },
        {
          mediaId: "cx-fig-06",
          theme: "street-life",
          note: "The arcade at ground level: the threshold where residential buildings are slowly converting to commercial use.",
          shapes: [
            { type: "rect", coords: [0.07, 0.823, 0.302, 0.177], label: "Arcade and shopfronts" },
          ],
          sourceRef: d(15),
        },
        {
          mediaId: "cx-fig-06",
          theme: "identity",
          note: "Renovations replace original detailing with generic finishes; the parts picked out in red are the ones at risk.",
          shapes: [
            { type: "rect", coords: [0.256, 0.371, 0.07, 0.242], label: "Original window detail" },
            { type: "rect", coords: [0.698, 0.306, 0.14, 0.081], label: "Original balcony" },
          ],
          sourceRef: d(15),
        },
      ],
      quotes: [
        { text: "In Zamalek, residential buildings are slowly converting into commercial, while façade renovations replace original detailing with generic finishes.", sourceRef: d(15) },
        { text: "Climate responsive architecture can still be seen through shaded sidewalks, balconies, and unspoken borders between public and private.", sourceRef: d(16) },
      ],
      pages: [14, 15, 16, 24],
    },
    {
      id: "west-el-balad",
      name: "West el Balad",
      condition: "Downtown Cairo — historic façades over active commercial ground floors, under pressure from renovation for business and capital.",
      summary:
        "West el Balad shares Zamalek’s historic depth but shows loss of architectural identity through minimal storefronts and renovations made for business and capital. The analytical drawings dwell on balconies and street shading, the ‘unspoken borders’ between public and private, and the belief that architecture must be felt and lived, not just seen.",
      observations: [
        { theme: "built-form", text: "A typical façade: layered balconies, cornices and ornament over a ground floor of storefronts.", sourceRef: d(14) },
        { theme: "street-life", text: "Dense, busy, mixed-use streets; storefronts and renovations are increasingly minimal and commercial.", sourceRef: d(15) },
        { theme: "climate-response", text: "Balconies and street shading are emphasised in the drawing as the district’s climate strategy.", sourceRef: d(15) },
        { theme: "identity", text: "Architects interviewed saw streets losing their specificity to generic storefronts and repetitive alterations aimed at fast commercial return.", sourceRef: d(20) },
      ],
      figures: ["cx-fig-04", "cx-fig-05"],
      annotations: [
        {
          mediaId: "cx-fig-04",
          theme: "built-form",
          note: "The corner turret, cornice and stacked balconies of a typical downtown building; the ground floor is where renovation pressure shows first.",
          shapes: [
            { type: "ellipse", coords: [0.358, 0.012, 0.295, 0.265], label: "Corner turret and dome" },
            { type: "rect", coords: [0.295, 0.313, 0.4, 0.205], label: "Stacked corner balconies" },
            { type: "rect", coords: [0.084, 0.759, 0.842, 0.205], label: "Commercial ground floor" },
          ],
          sourceRef: d(14),
        },
        {
          mediaId: "cx-fig-05",
          theme: "climate-response",
          note: "Balcony and street shading, highlighted in red pencil in the original drawing.",
          shapes: [
            { type: "rect", coords: [0.44, 0.1, 0.333, 0.15], label: "Balconies picked out in red" },
            { type: "rect", coords: [0.093, 0.25, 0.267, 0.11], label: "Awning over the pavement" },
            { type: "rect", coords: [0.4, 0.64, 0.507, 0.2], label: "Deep balcony and shutters" },
          ],
          sourceRef: d(15),
        },
        {
          mediaId: "cx-fig-04",
          theme: "street-life",
          note: "Shopfronts open the corner to the street: the dense, mixed-use life the dissertation describes.",
          shapes: [
            { type: "rect", coords: [0.084, 0.759, 0.842, 0.205], label: "Ground-floor shopfronts" },
          ],
          sourceRef: d(14),
        },
        {
          mediaId: "cx-fig-05",
          theme: "identity",
          note: "Street life is read from below: the architecture is felt and lived from the pavement, not seen as a façade alone.",
          shapes: [
            { type: "rect", coords: [0.133, 0.55, 0.333, 0.4], label: "Tree and street level" },
            { type: "rect", coords: [0.4, 0.64, 0.507, 0.2], label: "Balcony as lived threshold" },
          ],
          sourceRef: d(15),
        },
      ],
      quotes: [
        { text: "West El Balad also shows a loss of architectural identity through minimal storefronts and renovations done for business and capital.", sourceRef: d(15) },
        { text: "Many streets have lost their specificity, replaced by generic storefronts and repetitive alterations aimed at fast commercial return rather than cultural continuity.", sourceRef: d(20, "Hisham Ghorab, interview") },
      ],
      pages: [14, 15, 20],
    },
    {
      id: "ashwaiyat",
      name: "Ashwa’iyat",
      condition: "Informal neighbourhoods — organically grown, built incrementally to residents’ needs, often omitted from official planning.",
      summary:
        "The Ashwa’iyat are read as an alternative mode of urban production focused on needs, adaptation and community: compact building, flexible construction added over time, and strong street life. Rather than being bought out by developers, residents have stayed, and artists have painted large murals across the existing façades, expressing collective identity and memory in the urban fabric. The dissertation argues they offer a bottom-up resistance to homogenisation.",
      observations: [
        { theme: "built-form", text: "Compact, incremental construction with the flexibility to add storeys over time; some structures semi-inhabited or broken down.", sourceRef: d(17) },
        { theme: "street-life", text: "A strong street-life presence, spontaneous interaction and intense spatial use.", sourceRef: d(18) },
        { theme: "climate-response", text: "Dense, close-packed fabric; the drawings record the landscape as a whole rather than a climatic device.", sourceRef: d(16) },
        { theme: "identity", text: "Murals and façade designs on the existing structures express identity, culture and rooted memory; informal practices are described by the interviewed architects as carriers of urban identity.", sourceRef: d(17) },
      ],
      figures: ["cx-fig-08", "cx-fig-09", "cx-fig-11"],
      annotations: [
        {
          mediaId: "cx-fig-08",
          theme: "built-form",
          note: "A landscape of close-packed blocks at varying heights: incremental construction read as a whole.",
          shapes: [
            { type: "rect", coords: [0.1, 0.58, 0.52, 0.28], label: "Rooftops outlined in red: a continuous, close-packed fabric" },
            { type: "rect", coords: [0.78, 0.55, 0.2, 0.2], label: "Unfinished frame awaiting another storey" },
            { type: "rect", coords: [0.72, 0.22, 0.28, 0.38], label: "Taller formal blocks at the edge" },
          ],
          sourceRef: d(16),
        },
        {
          mediaId: "cx-fig-09",
          theme: "street-life",
          note: "The street view: openings, balconies and additions stack up around the life of the street.",
          shapes: [
            { type: "rect", coords: [0.111, 0.513, 0.389, 0.462], label: "Additions and enclosed balconies" },
            { type: "rect", coords: [0.556, 0.05, 0.222, 0.65], label: "Painted façade panels" },
          ],
          sourceRef: d(17),
        },
        {
          mediaId: "cx-fig-11",
          theme: "identity",
          note: "A semi-inhabited, broken-down building: the drawing records occupation continuing within an unfinished frame.",
          shapes: [
            { type: "rect", coords: [0.43, 0.33, 0.19, 0.17], label: "Open stair inside the frame" },
            { type: "rect", coords: [0.3, 0.55, 0.18, 0.11], label: "Brick infill, floor by floor" },
            { type: "rect", coords: [0.65, 0.12, 0.19, 0.18], label: "Occupied upper corner" },
          ],
          sourceRef: d(18),
        },
        {
          mediaId: "cx-fig-08",
          theme: "climate-response",
          note: "Dense, close-packed fabric with narrow gaps; the dissertation reads this as adaptation to need rather than as a climatic device.",
          shapes: [
            { type: "rect", coords: [0.1, 0.58, 0.52, 0.28], label: "Close-packed roofs and narrow gaps" },
          ],
          sourceRef: d(16),
        },
        {
          mediaId: "cx-fig-09",
          theme: "identity",
          note: "Murals and façade designs painted over the existing structures express identity, culture and rooted memory.",
          shapes: [
            { type: "rect", coords: [0.556, 0.05, 0.222, 0.65], label: "Painted façade" },
            { type: "rect", coords: [0.111, 0.513, 0.389, 0.462], label: "Additions in red" },
          ],
          sourceRef: d(17),
        },
      ],
      quotes: [
        { text: "It reveals an alternative of urban production that solely focuses on needs, adaptation, and community.", sourceRef: d(17) },
        { text: "Murals turned walls into collective art, revealing identity through colour, poetry, and context.", sourceRef: d(23, "Nehal Lehta, interview") },
      ],
      pages: [16, 17, 18, 19],
    },
  ],
  comparison: [
    {
      theme: "built-form",
      label: "Built form",
      byCase: {
        "new-administrative-capital": "Near-identical glass towers and blocks on wide boulevards; isolated objects composed for the distant view.",
        zamalek: "Historic apartment buildings with balconies and ornament; detailing is being replaced in renovation.",
        "west-el-balad": "Downtown façades over commercial ground floors; storefronts becoming minimal and generic.",
        ashwaiyat: "Compact incremental blocks that grow storey by storey; some unfinished or semi-inhabited.",
      },
    },
    {
      theme: "street-life",
      label: "Street life",
      byCase: {
        "new-administrative-capital": "Little public space, mainly for show; vehicle movement prioritised over pedestrians.",
        zamalek: "Dense mixed-use streets; residential uses converting to commercial.",
        "west-el-balad": "Busy mixed-use streets shaped by everyday social interaction.",
        ashwaiyat: "Strong, spontaneous street life and intense spatial use.",
      },
    },
    {
      theme: "climate-response",
      label: "Climate response",
      byCase: {
        "new-administrative-capital": "Sealed glass and mechanical cooling instead of shading, courtyards and thick walls.",
        zamalek: "Shaded sidewalks, balconies and narrow streets still work; renovations favour sealed interiors.",
        "west-el-balad": "Balconies and street shading are the drawn emphasis.",
        ashwaiyat: "Dense, close-packed fabric; not analysed as a climatic device in the source.",
      },
    },
    {
      theme: "identity",
      label: "Identity",
      byCase: {
        "new-administrative-capital": "Identity replaced by bigger, modern designs detached from place — the Generic City.",
        zamalek: "Slow, incremental loss through commercial renovation; historic touch retained for now.",
        "west-el-balad": "Specificity giving way to repetitive alterations aimed at fast commercial return.",
        ashwaiyat: "Identity expressed through murals, additions and everyday routines; a bottom-up resistance.",
      },
    },
  ],
  perspectives: [
    {
      title: "Developer-led urbanism",
      text: "The dominant theme across the interviews: market-centred logic and developer control drive homogenisation, prioritising visual appeal, branding and financial efficiency over climatic, cultural and contextual design.",
      sourceRefs: [d(20)],
    },
    {
      title: "Identity beyond façades",
      text: "Homogenisation reaches into social life: the decline of public space and street life through private compounds and gated development, and an identity that lives in the daily life a façade contains rather than in heritage façades alone.",
      sourceRefs: [d(20), d(21)],
    },
    {
      title: "Loss of climate responsiveness",
      text: "Sealed glass buildings disregard shading, courtyards and local materials; the climate intelligence shared by minarets, courtyards and arcades across eras has, in one architect’s words, fractured.",
      sourceRefs: [d(21)],
    },
    {
      title: "Adaptive reuse and context",
      text: "Strategies that resist homogenisation: preserving historic exteriors while adapting interiors, and designing from site conditions, climate and human behaviour to encourage movement, interaction and belonging.",
      sourceRefs: [d(22)],
    },
    {
      title: "Informal practices as carriers of identity",
      text: "The Ashwa’iyat are read not as failed attempts but as sites of organic identity, where murals and continued rituals such as hospitality keep core experiences alive alongside physical preservation.",
      sourceRefs: [d(22), d(23)],
    },
  ],
  insights: [
    { text: "Across all four studies, homogenisation comes out as a complex process. It is controlled by economic ambition, developer control, and foreign architectural styles.", sourceRef: d(19) },
    { text: "These case studies demonstrate that architectural identity in Cairo is not vanishing overtime, but is being renovated bit by bit.", sourceRef: d(19) },
    { text: "Beyond façades and styles, identity is born in atmosphere, rituals, and interactions.", sourceRef: d(24) },
  ],
  conclusion: {
    text: "Homogenisation is not a final outcome, but an ongoing back and forth discussion. Merely a negotiation between modernisation and memory. Cairo has the opportunity to change repetition into relevance and homogenisation into shared identity.",
    sourceRef: d(25),
  },
  bibliography: [
    { text: "Arafa, W. (2018) Building with Memory: Contemporary Architecture in Egypt. Cairo: Dar El Sherouk.", sourceRef: d(26) },
    { text: "Fathy, H. (1973) Architecture for the Poor: An Experiment in Rural Egypt. Chicago: University of Chicago Press.", sourceRef: d(26) },
    { text: "Frampton, K. (1983) ‘Towards a Critical Regionalism: Six Points for an Architecture of Resistance’, in Foster, H. (ed.) The Anti-Aesthetic: Essays on Postmodern Culture. Seattle: Bay Press, pp. 16–30.", sourceRef: d(26) },
    { text: "Ghorab, H. (2025) Interview by Tala Hagras, 28 December 2025, Cairo.", sourceRef: d(26) },
    { text: "King, A.D. (2004) Spaces of Global Cultures: Architecture, Urbanism, Identity. London: Routledge.", sourceRef: d(26) },
    { text: "Koolhaas, R. (1995) S,M,L,XL. New York: Monacelli Press.", sourceRef: d(26) },
    { text: "Lehta, N. (2026) Interview by Tala Hagras, 05 January 2026, Cairo.", sourceRef: d(26) },
    { text: "Leithy. (2026) Interview by Tala Hagras, 11 January 2026, Cairo.", sourceRef: d(26) },
    { text: "Molloy, M. (2016) Artist creates amazing murals across 50 buildings in Cairo, The Telegraph.", sourceRef: d(26) },
    { text: "Norberg-Schulz, C. (1980) Genius Loci: Towards a Phenomenology of Architecture. New York: Rizzoli.", sourceRef: d(27) },
    { text: "Pallasmaa, J. (2012) The Eyes of the Skin: Architecture and the Senses. 3rd edn. Chichester: Wiley.", sourceRef: d(27) },
    { text: "Salem, M. (2025) Interview by Tala Hagras, 24 December 2025, Cairo.", sourceRef: d(27) },
    { text: "Sassen, S. (2001) The Global City: New York, London, Tokyo. 2nd edn. Princeton: Princeton University Press.", sourceRef: d(27) },
    { text: "Zumthor, P. (2006) Atmospheres: Architectural Environments – Surrounding Objects. Basel: Birkhäuser.", sourceRef: d(27) },
  ],
  figureCredits: [
    { figure: 1, credit: "The New Administrative Skyline, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 2, credit: "The Large Grandiose Entrance into The New Administrative, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 3, credit: "The Linear Generic Formal Building Facades of The New Administrative, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 4, credit: "The Exterior Facade of a Typical Building in West el Balad, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 5, credit: "Street view of Facade in West el Balad showing balconies and street shading, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 6, credit: "The Exterior Facade of a Typical Building in Zamalek, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 7, credit: "Worm’s Eye View showing the narrow streets between building and use of shading, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 8, credit: "Ashwa’iyat Landscape Overview, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
    { figure: 9, credit: "Street View of Typical Ashwa’iyat Facade, drawn by Author", thirdParty: false, sourceRef: d(28) },
    { figure: 10, credit: "Image of Mural of Ashwa’iyat seen from the Highway, captured by Seed, El. (2016), via The Telegraph — third-party photograph, not reproduced on this site", thirdParty: true, sourceRef: d(28) },
    { figure: 11, credit: "Semi Inhabited Broken Down Ashway, drawn by Tala Hagras", thirdParty: false, sourceRef: d(28) },
  ],
  download: {
    href: "/downloads/Tala-Hagras-Homogenisation-of-Cairos-Urban-Horizons-reading-edition.pdf",
    label: "Reading edition (PDF, 28 pages)",
    note: "Main text, bibliography and figure references. The appendices (interview questions, drawings, ethics documentation) are not included.",
  },
};

export const RESEARCH_THEMES: { id: ResearchChapter["comparison"][number]["theme"]; label: string }[] = [
  { id: "built-form", label: "Built form" },
  { id: "street-life", label: "Street life" },
  { id: "climate-response", label: "Climate response" },
  { id: "identity", label: "Identity" },
];
