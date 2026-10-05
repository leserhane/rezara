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

`src/three/HeroScene.js` builds a pair of glasses entirely from Three.js
primitives (`TorusGeometry` rims, `TubeGeometry` bridge/temples, a
`CircleGeometry` lens pane) — there's no external 3D model/asset to
source or license, every shape is procedural. It runs on its own
`requestAnimationFrame` loop, independent of scroll position:

- The whole group auto-rotates continuously around Y (with a small Z-axis
  wobble for life).
- The lens material cycles between a clear "optical" look and a dark
  "sunglasses" tint on a smooth ~9s loop (`LOOP_SECONDS` in
  `HeroScene.js`), via `MeshPhysicalMaterial` color/opacity interpolation
  — not a swapped texture.
- An `IntersectionObserver` in `main.js` pauses the render loop whenever
  the hero scrolls out of view, so it never burns GPU/battery for a
  section the visitor isn't looking at.
- `isWebGLAvailable()` feature-detects WebGL before mounting anything; if
  it's unavailable the canvas is hidden and the hero's CSS background
  gradient carries the scene — the headline and copy already convey the
  brand without it.
- Under `prefers-reduced-motion: reduce`, `HeroScene.renderStatic()`
  draws one still frame (a fixed rotation, lenses held at a mid-tint)
  instead of starting the loop.

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
    HeroScene.js               Procedural 3D glasses, auto-rotate + lens-tint loop
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
