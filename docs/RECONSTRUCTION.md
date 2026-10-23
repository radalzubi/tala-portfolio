# Reconstruction notes — interpretive 3D studies

Both 3D studies on the site are **interpretive reconstructions** built procedurally from the portfolio
drawings. No CAD, mesh or dimensioned drawing was supplied (the archive contains two PDFs with no 3D
annotations or attachments; see `sources/derived/inventory.json`). Everything below is proportional.
Model units are notional metres, +Y is up, the ground plane is y = 0 and the canal lies towards +Z.

Each viewer carries the label “Interpretive 3D study based on the portfolio drawings” with an expanded
disclosure (`ModelSpec.disclosure` and `assumptions` in `src/content/projects.ts`). Measurement tools are
deliberately absent. The original drawings are shown beside every viewer and remain the authority.

## Maison Peplum (`src/components/models/maison-peplum/`)

Sources: portfolio p.8 (exterior render), p.9 (garment studies, tectonic models, 1:200 façade model),
p.10 (ground and roof plans in context, exploded axonometric), p.11 (section 1:50, façade assembly list,
wall build-up detail), p.12 (night and interior renders, 1:50 section model, 1:200 façade model).

| Element | What the source shows | How it is modelled | Confidence |
| --- | --- | --- | --- |
| Existing shell | A pitched-roof, two-storey warehouse (section p.11; plans p.10); brick with existing timber/steel frames (wall detail p.11) | Rectangular shell 30 × 13 m (proportional), eaves ≈ 7 m, ridge ≈ 10.2 m, gable ends as solid walls, first-floor slab at ≈ 3.6 m | Proportions read from the section; length-to-width ratio from the plan |
| Fins | Repeated curved fins on both long faces, rising over the roof; flared “hem” at the bottom; wave rhythm along the row (p.9 model, p.11 section, p.8/12 renders) | 38 fins per face, extruded 2D profiles generated from an inner path (wall then roof slope) offset by a depth function: flare at the hem, travelling sine folds, taper to the ridge | Count and spacing chosen for the visible rhythm, not counted from a drawing |
| Upper-floor glazing and frame | Glazed long façades behind the fins with steel mullions, transoms and cross bracing (section p.11 “Steel Beams Cross Bracing”) | Semi-transparent glass planes with a merged box-geometry frame; diagonal braces every other bay | Member sizes invented for legibility |
| Cantilever and base | Upper floor cantilevers over a recessed glazed ground floor on steel beams (section p.11 “Cantilever Steel Beam”) | Ground floor inset 0.8 m on each long side; eleven beams per side | Inset depth is a guess |
| Roof | Pitched roof over the shell (section p.11) | Two slabs and a ridge member; lifts away in the assembly study | — |
| Canal and quay | Canal beside the building (plan p.10, section p.11 water at left) | Flat plane at +Z and a quay strip | Position only |
| Interior | Two floors, timber stair (section p.11) | Not modelled beyond slabs | Interiors are out of scope |

Materials: fins use a warm timber colour sampled from the renders (`#b9743f`–`#9c5a2d`); shell, roof and
floors are pale warm greys; glass is tinted and translucent. None of this is a verified specification.

Assembly study (`assembly` 0 → 1): fins translate outwards and upwards with a stagger (smoothstep over the
first 75 % of the range); the roof lifts over the final 70 %. The source assembly list names hanger ribs,
fin support ribs and unistrut connectors but does not draw them; they are not modelled.

Light study: a directional light swings from east to west with a higher noon elevation. Illustrative
only — not a solar simulation, no site orientation is known.

## Music institution (`src/components/models/music-institution/`)

Sources: portfolio p.4 (site plan), p.5 (section with construction legend CT01–CT20 and space-use legend;
exploded axonometric with space-use legend SU01–SU14), p.7 (exterior render, interior render, model
photographs), p.3 (concept exploded sketch).

| Element | What the source shows | How it is modelled | Confidence |
| --- | --- | --- | --- |
| Drum | A two-storey ring of rooms around a central circular performance hall (plan p.4, axonometric p.5) | Annular floor plates with a central void; proportional diameter ≈ 26 m | Diameter is proportional; storey heights read from the section |
| Hall | Double-height performance space with a sunken floor and stepped seating (section p.5 SU02–SU03) | Sunken cylinder with concentric stepped seating arcs | Seating geometry simplified |
| Mezzanine | Mezzanine round hall overlooking the performance space (section SU05, axonometric SU07) | Ring at first-floor level | — |
| Roof | Flat roof disc with a central skylight; extensive green roof build-up (section CT04, axonometric SU13–SU14; render p.7) | Thin disc with an oculus and a planting annulus | Overhang depth from the render |
| Annexe | A smaller cylinder clad in vertical timber slats (render p.7; axonometric outdoor elements) | Instanced slats on a cylinder | Position relative to the drum estimated from the render |
| Terraces | Curved stepped seating from the building down to the canal (plan p.4, section p.5 outdoor SU01) | Concentric curved steps towards +Z | Step count not drawn |
| Outdoor stage | Outdoor performance areas and a curved slatted screen (axonometric SU02) | Curved screen of slats | — |
| Canal | Canal along the south-east edge (plan p.4) | Flat plane | Position only |

Section preset: the viewer applies a clipping plane through the centre of the drum. The paired drawing is
Tala’s own section (p.5), which remains the authoritative description of the interior.

## What would unlock faithful models

Rhino, Revit, SketchUp, Blender, OBJ, FBX or glTF exports of either project, or dimensioned plans and
sections. `docs/CONTENT_NEEDED.md` tracks these requests. Replacing a procedural model with a supplied
mesh means adding a GLB loader branch in `src/components/viewer/viewer-canvas.tsx` and setting
`model.kind = "original"` in the content record; the viewer shell, presets and hotspot data do not change.
