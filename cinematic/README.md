# Optimum Optic — Cinematic Canvas Prototype

A scroll-scrubbed, 240-frame canvas cinematic landing page. **Zero
animation libraries** — the frame engine, scroll sync, and every
transition (opacity/transform/blur/clip-path/letter-spacing/scale) are
vanilla JS and CSS. This is a standalone prototype, not wired into the
repo's live GitHub Pages deploy or the ERP — see the root `README.md`
for how this repo is organized.

## Status: placeholder frames

There is no real photographed/rendered sequence yet, so
`public/frames/frame_001.webp … frame_240.webp` are **generated
placeholders** — an abstract animation of the brand's interlocked-rings
mark over a narrative color gradient (dark → champagne beige → burgundy
→ dark), built by `scripts/generate-frames.mjs`. Deliberately not
literal product photography — see brief constraints below.

**To swap in a real sequence:** replace the 240 files in
`public/frames/` with the same names (`frame_001.webp` … `frame_240.webp`,
zero-padded to 3 digits). Nothing in `src/` needs to change unless the
frame count itself changes (`FRAME_COUNT` in `src/config.js`).

To regenerate the placeholders: `npm run generate-frames`.

## Also placeholder: business details

Address, hours, phone, email, Instagram, and product prices in
`index.html` / `src/components/products.js` are all marked "à
confirmer" / "à venir" — nothing is invented. Fill in real values when
they're confirmed.

## Architecture

```
index.html                    Semantic markup, SEO/OG meta, JSON-LD
src/
  config.js                   FRAME_COUNT, frame path generator, CHAPTERS
  canvas/
    FrameLoader.js            Progressive decode, cache, retry, priority-first
    CanvasRenderer.js         DPR-aware "cover" drawing — loadFrame/renderFrame/resize/destroy
  utils/
    ScrollController.js       Scroll position -> progress (0..1); IntersectionObserver-gated
    ChapterController.js      progress -> {frame, chapter, localProgress}
  components/
    Preloader.js               Real decode-progress preloader UI
    UIController.js            Chapter text crossfade, progress HUD, mobile nav
    products.js                Placeholder product grid renderer
    cursor.js                  Subtle desktop-only custom cursor
  styles/                      base, header, preloader, cinematic, sections
scripts/
  generate-frames.mjs          Generates the 240 placeholder WebP frames
public/frames/                 The 240 frame files served at /frames/frame_NNN.webp
```

## How the scroll sync works

`section.cinematic-track` is a normal, tall (650vh desktop / 560vh
mobile) document-flow element — it is **not** the scroll container and
nothing hijacks native scrolling. Inside it, `.cinematic-sticky` uses
plain CSS `position: sticky; top: 0` to pin the canvas while the track
scrolls past underneath. `ScrollController` reads
`trackElement.getBoundingClientRect()` to turn that physical scroll
distance into a 0..1 progress value, throttled to rAF and only computed
while the track is anywhere near the viewport (IntersectionObserver).
`ChapterController` maps progress to a frame index
(`floor(progress * 239) + 1`) and the active editorial chapter.

## Chapters (frame ranges)

| # | Title | Frames |
|---|-------|--------|
| 01 | The Arrival | 1–35 |
| 02 | The Collection | 36–75 |
| 03 | The Detail | 76–115 |
| 04 | The Fit | 116–155 |
| 05 | The Light | 156–195 |
| 06 | Your Signature | 196–240 |

## Reduced motion

Under `prefers-reduced-motion: reduce`, the scroll-scrub is skipped
entirely: a single representative frame is decoded and drawn once, the
canvas becomes a normal fixed-height image band (not scroll-jacked),
and every chapter renders as a normal stacked, fully-visible block
(`UIController.renderStatic()`) — no crossfades, nothing hidden, full
keyboard/reader access preserved.

## Develop / build

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # -> dist/
npm run preview   # serve the production build locally
```
