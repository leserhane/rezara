# Optimum Optic — Landing Page Prototype

A hero built around an auto-playing WebGL 3D glasses animation, above a
set of static editorial sections and the storefront/collection/product
content. This is a standalone prototype, not wired into the repo's live
GitHub Pages deploy or the ERP — see the root `README.md` for how this
repo is organized.

This previously used a 650vh scroll-scrubbed canvas sequence (240
procedurally generated frames) as the hero, with 6 chapters of text
crossfading in sync with scroll position. That's been removed in favor
of a hero that plays on its own timeline and needs no scrolling to be
seen — see "What changed" below.

## The 3D hero

`src/three/HeroScene.js` loads a real supplied 3D model
(`public/models/monture.glb`, via Three.js's `GLTFLoader`) — not
procedural geometry. It runs on its own `requestAnimationFrame` loop,
independent of scroll position:

- The model auto-rotates continuously around Y, one full turn every 12
  seconds (`TURN_SECONDS`). The camera is framed to the model's actual
  bounding sphere on load, so it fills the canvas regardless of the
  asset's authored scale.
- The lens material cycles between a clear "Optique" look and a dark
  "Solaire" tint once per turn, timed to flip as the model's face swings
  back toward the camera (`FLIP_LEAD`/`MIX_SPEED` in `HeroScene.js`), via
  direct material color/opacity interpolation on the lens meshes
  (`Verre_Droit`/`Verre_Gauche`) — not a swapped texture. The two tint
  values are the model's own embedded material definitions
  ("Verre_Optique"/"Verre_Solaire"), not invented. This mirrors the
  behavior already authored into the source demo this model was
  extracted from.
- An `IntersectionObserver` in `main.js` pauses the render loop whenever
  the hero scrolls out of view, so it never burns GPU/battery for a
  section the visitor isn't looking at.
- `isWebGLAvailable()` feature-detects WebGL before mounting anything; if
  it's unavailable the canvas is hidden and the hero's CSS background
  gradient carries the scene — the headline and copy already convey the
  brand without it. The same fallback fires if the GLB fails to load.
- Under `prefers-reduced-motion: reduce`, `HeroScene.renderStatic()`
  draws one still frame (a fixed, slightly turned angle, lenses held at
  a mid-tint) instead of starting the loop.

Three.js is a real dependency here (`package.json`), which is a
deliberate exception to this prototype's earlier "zero animation
libraries" rule — a genuine WebGL 3D model needs a 3D rendering library;
there was no way around that once "real 3D" was the ask.

## What changed from the scroll-cinematic version

- **Removed**: the 650vh/560vh scroll-scrubbed track, `FrameLoader`,
  `CanvasRenderer`, `ScrollController`, `ChapterController`,
  `UIController`, the full-screen decode-progress `Preloader`,
  `scripts/generate-frames.mjs`, and the 240 generated WebP frames in
  `public/frames/`. None of it is referenced anymore — there's nothing
  left scrubbing a frame sequence to scroll position.
- **Kept**: the opening chapter's copy ("LE REGARD QUI VOUS RESSEMBLE")
  as the new hero's headline — it just no longer waits for scroll to
  reveal itself, and plays a one-shot fade/rise-in on load instead
  (plain CSS `@keyframes`, skipped under reduced motion).
- **Kept, but de-animated**: the other 5 chapters (Collection, Detail,
  Fit, Light, Signature) are now plain static sections in `index.html`,
  using the same `.section`/`.section__eyebrow`/`.section__title`
  pattern as the storefront/collection/products sections below them.
  They render normally as you scroll to them — nothing crossfades or
  scrubs; there's no JS driving their text at all anymore.
- **Removed**: the full-screen preloader. It existed to show truthful
  progress while decoding the priority frames before reveal; with no
  frame sequence to decode, a blocking preloader had nothing left to
  justify it.

## The 3D model asset

`public/models/monture.glb` is a real glTF 2.0 model supplied directly
(not generated or scraped) — a pair of glasses authored with a
`KHR_materials_variants` extension exposing an "Optique"/"Solaire" lens
pair, which is what the hero's lens-tint behavior is built around. If
this model is ever swapped for a different one, keep the mesh names
(`Verre_Droit`/`Verre_Gauche`) or update the names `HeroScene.js` looks
for in its `model.traverse()` call.

## Also placeholder: business details

Address, hours, phone, email, and Instagram in `index.html` are all
marked "à confirmer" / "à venir" — nothing is invented. Fill in real
values when they're confirmed.

## Product cards: real photography, supplied by the owner

The cards in `src/components/products.js` use real product photography
supplied directly by Optimum Optic's owner (`public/products/*.webp`),
with a short descriptive line instead of a price. This is different
from scraping photos off the web: it's the business owner's own content
decision for their own store. It only holds up if Optimum Optic
actually carries these models and has the rights to display this
photography (e.g. manufacturer/dealer-supplied catalog images, or the
store's own photos) — swap in a different model's photo any time by
replacing its file in `public/products/` and updating the `image` field
in `PRODUCT_PLACEHOLDERS`.

## Architecture

```
index.html                    Semantic markup, SEO/OG meta, JSON-LD
src/
  three/
    HeroScene.js               Loads public/models/monture.glb, auto-rotate + lens-tint loop
  components/
    products.js                 Product grid renderer
    cursor.js                   Subtle desktop-only custom cursor
  styles/                       base, header, hero, sections
main.js                        Bootstraps the hero scene, nav toggle, cursor
```

## Reduced motion

Under `prefers-reduced-motion: reduce`, the hero's one-shot entrance
animations are skipped (content is simply visible, no fade/rise), and
the 3D scene renders a single still frame instead of starting its
rotate/tint loop. Nothing on the page is scroll-jacked at any point —
full keyboard/reader access throughout.

## Develop / build

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # -> dist/
npm run preview   # serve the production build locally
```
