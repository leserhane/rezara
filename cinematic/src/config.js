/**
 * Single source of truth for the cinematic sequence. Swap in a real
 * photographed/rendered frame set by replacing the files in
 * public/frames/ (same names, same count) — nothing here or in
 * src/canvas/* needs to change unless FRAME_COUNT itself changes.
 */

export const FRAME_COUNT = 240;

/** Zero-padded to 3 digits: frame_001.webp … frame_240.webp */
export function framePath(index) {
  const n = String(index).padStart(3, "0");
  return `${import.meta.env.BASE_URL}frames/frame_${n}.webp`;
}

/**
 * Chapters partition the 240 frames into editorial beats. `start`/`end`
 * are 1-based, inclusive frame numbers.
 */
export const CHAPTERS = [
  {
    id: "arrival",
    label: "Chapter 01",
    title: "The Arrival",
    start: 1,
    end: 35,
    heading: ["LE REGARD", "QUI VOUS", "RESSEMBLE"],
    body: "Eyewear selected around your style, your vision and your personality.",
    cta: "EXPLORE COLLECTION",
  },
  {
    id: "collection",
    label: "Chapter 02",
    title: "The Collection",
    start: 36,
    end: 75,
    heading: ["UNE COLLECTION", "PENSÉE POUR", "CHAQUE REGARD"],
    tag: "SUNGLASSES",
    tagline: "POLARIZED COLLECTION",
  },
  {
    id: "detail",
    label: "Chapter 03",
    title: "The Detail",
    start: 76,
    end: 115,
    heading: ["CHAQUE DÉTAIL", "COMPTE"],
    tag: "OPTICAL",
    tagline: "PRECISION & STYLE",
  },
  {
    id: "fit",
    label: "Chapter 04",
    title: "The Fit",
    start: 116,
    end: 155,
    heading: ["UN AJUSTEMENT", "PARFAIT"],
    tag: "SIGNATURE",
    tagline: "YOUR EVERYDAY FRAME",
  },
  {
    id: "light",
    label: "Chapter 05",
    title: "The Light",
    start: 156,
    end: 195,
    heading: ["LA LUMIÈRE", "RÉVÈLE", "LA PRÉCISION"],
    body: "Lenses engineered for clarity in every light.",
  },
  {
    id: "signature",
    label: "Chapter 06",
    title: "Your Signature",
    start: 196,
    end: 240,
    heading: ["VOTRE", "SIGNATURE"],
    body: "Optimum Optic — le regard qui vous ressemble.",
  },
];

export function chapterForFrame(frame) {
  return (
    CHAPTERS.find((c) => frame >= c.start && frame <= c.end) ?? CHAPTERS[CHAPTERS.length - 1]
  );
}

export function chapterIndexForFrame(frame) {
  return CHAPTERS.findIndex((c) => frame >= c.start && frame <= c.end);
}
