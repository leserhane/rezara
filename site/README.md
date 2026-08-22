# Optimum Optic — Coming Soon site

Source for the public marketing homepage at `optimumoptic.com`. Next.js
(static export) + TypeScript + Tailwind CSS + GSAP/ScrollTrigger + Lenis.

## Why static export

GitHub Pages here serves whatever is committed at the repo root — there is
no build step on GitHub's side (same pattern as `/frontend` → `/dashboard`
for the ERP). So this project builds locally/in-session and the contents of
`out/` are copied to the repo root and committed.

## Develop

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build            # writes static site to ./out
# copy out/* to the repo root (see repo root README for the boundary
# between this site and the ERP under /frontend, /dashboard, /database)
```

## Brand substitutions

- **Typeface**: the official Optimum Optic wordmark uses a geometric
  sans (rounded terminals, wide tracking). No brand font file was
  provided, so **Poppins** is used as the closest professional match for
  display type, paired with **Inter** for body copy/legibility. Swap both
  in `app/layout.tsx` if official font files become available.
- **Colors**: extracted directly from the provided logo artwork (see
  `lib/config/theme.ts` for the exact values and where each was sampled
  from) — not invented.

## Content that is intentionally empty

`lib/config/site.ts` centralizes everything that isn't confirmed yet
(opening date, address, coordinates, phone, Instagram, WhatsApp). Fill
those in when the information is confirmed — no component needs to change.
