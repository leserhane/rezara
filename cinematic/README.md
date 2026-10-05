# Optimum Optic — Landing Page Prototype

A scroll-driven WebGL 3D glasses hero spanning the first 6 chapters of
copy, above the storefront/collection/product content below it. This is
a standalone prototype, not wired into the repo's live GitHub Pages
deploy or the ERP — see the root `README.md` for how this repo is
organized.

## The scroll-driven 3D stage

`index.html`'s `.scroll-stage` (styled in `src/styles/scroll-stage.css`)
holds 6 chapters of copy (`.chapter`) in a tall scrolling column next to
a `position: sticky` panel holding the 3D canvas — the glasses stay
pinned on screen for the whole 6-chapter scroll, while the copy scrolls
past beside them (stacked above/below them instead on narrow viewports).
There's no scroll-jacking anywhere: it's native scrolling throughout,
just a pinned column, the same CSS technique as a sticky sidebar.

`src/utils/scrollStage.js` reads how far the visitor has scrolled through
that column and turns it into a plain 0–1 `progress` number
(rAF-throttled on `scroll`/`resize`). `src/three/HeroScene.js` loads a
real supplied 3D model (`public/models/monture.glb`, via Three.js's
`GLTFLoader`) and turns that progress into motion:

- The model rotates one full turn across the entire 6-chapter scroll —
  `progress = 0` (top of chapter 1) and `progress = 1` (bottom of
  chapter 6) land on the same front-on pose, bookending the journey.
  The camera is framed to the model's actual bounding sphere on load, so
  it fills the canvas regardless of the asset's authored scale.
- The lens material fades from a clear "Optique" look at the top of the
  scroll to a dark "Solaire" tint at the bottom — directly tying the
  site's "optic to sun" idea to reading through the chapters, via direct
  material color/opacity interpolation on the lens meshes
  (`Verre_Droit`/`Verre_Gauche`), not a swapped texture. The two tint
  values are the model's own embedded material definitions
  ("Verre_Optique"/"Verre_Solaire"), not invented.
- Rotation/tint don't jump straight to the latest scroll position —
  `HeroScene.start()`'s render loop exponentially smooths toward it
  every frame (`FOLLOW_RATE`), so a fast flick or trackpad stutter
  settles in rather than snapping, which is what makes the motion read
  as smooth rather than scrubbed.
- An `IntersectionObserver` in `main.js` only tracks scroll and runs the
  render loop while some part of the 6-chapter stage is actually on
  screen, so it never burns GPU/battery once the visitor has scrolled
  past it into the storefront/collection sections below.
- `isWebGLAvailable()` feature-detects WebGL before mounting anything; if
  it's unavailable the canvas is hidden and the panel's own CSS
  background gradient carries the scene. The same fallback fires if the
  GLB fails to load.
- Under `prefers-reduced-motion: reduce`, `HeroScene.renderStatic()`
  draws one still frame (a fixed, slightly turned angle, lenses held at
  a mid-tint) and scroll is never bound to the model at all — nothing
  moves as you scroll.

Three.js is a real dependency here (`package.json`), which is a
deliberate exception to this prototype's earlier "zero animation
libraries" rule — a genuine WebGL 3D model needs a 3D rendering library;
there was no way around that once "real 3D" was the ask.

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
    HeroScene.js               Loads public/models/monture.glb, scroll-driven rotation + lens-tint
  utils/
    scrollStage.js             Reads scroll position through .scroll-stage -> a 0-1 progress number
  components/
    products.js                 Product grid renderer
    cursor.js                   Subtle desktop-only custom cursor
  styles/                       base, header, scroll-stage, hero (chapter-1 text), sections
main.js                        Bootstraps the hero scene, scroll binding, nav toggle, cursor
```

## Reduced motion

Under `prefers-reduced-motion: reduce`, chapter 1's one-shot entrance
animations are skipped (content is simply visible, no fade/rise), and
the 3D scene renders a single still frame instead of starting its
scroll-follow loop — scroll position is never bound to the model at all
in that case. The sticky layout itself is unaffected (it's not
animation, just CSS positioning); only the 3D motion is skipped. Nothing
on the page is scroll-jacked at any point — full keyboard/reader access
throughout.

## Develop / build

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # -> dist/
npm run preview   # serve the production build locally
```
