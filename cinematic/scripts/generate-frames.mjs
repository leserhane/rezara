/**
 * Generates 240 placeholder cinematic frames (abstract brand motion —
 * the interlocked-rings mark, an aperture/iris motif, and a sweeping
 * light band — never literal product photography) as WebP files.
 *
 * These exist so the frame-scrubbing engine (FrameLoader/CanvasRenderer/
 * ScrollController) is fully working end to end. Swap them for a real
 * photographed/rendered sequence later: same file names, same folder,
 * same FRAME_COUNT — the engine (src/canvas/*, src/config.js) needs no
 * changes.
 *
 * Run: npm run generate-frames
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "frames");

const FRAME_COUNT = 240;
const WIDTH = 1920;
const HEIGHT = 1080;

// Narrative color timeline (see cinematic/README.md for the chapter map).
// Two diagonal gradient stops, each interpolated across these control
// points so the whole 240-frame sequence reads as one continuous shot
// rather than 6 cross-faded clips.
const STOPS_A = [
  [0.0, "#14100d"],
  [0.14, "#2a211c"],
  [0.28, "#d9c8ae"],
  [0.46, "#e9dfc9"],
  [0.64, "#c9a9a0"],
  [0.8, "#f3ead9"],
  [0.92, "#7a2430"],
  [1.0, "#2b0f14"],
];

const STOPS_B = [
  [0.0, "#241a16"],
  [0.14, "#3e2e26"],
  [0.28, "#b9a583"],
  [0.46, "#d9c8ae"],
  [0.64, "#6b1f2a"],
  [0.8, "#d9c8ae"],
  [0.92, "#4a151c"],
  [1.0, "#120809"],
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Piecewise-linear color interpolation across named stops. */
function colorAt(stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const localT = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      const rgb0 = hexToRgb(c0);
      const rgb1 = hexToRgb(c1);
      return rgbToHex(rgb0.map((v, idx) => lerp(v, rgb1[idx], localT)));
    }
  }
  return stops[stops.length - 1][1];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Named chapter ranges — mirrors src/config.js CHAPTERS. Kept in sync
 * manually since this script has no bundler access to the app config. */
const CHAPTERS = [
  { start: 1, end: 35 }, // The Arrival
  { start: 36, end: 75 }, // The Collection
  { start: 76, end: 115 }, // The Detail
  { start: 116, end: 155 }, // The Fit
  { start: 156, end: 195 }, // The Light
  { start: 196, end: 240 }, // Your Signature
];

function chapterLocalProgress(frame) {
  const index = CHAPTERS.findIndex((c) => frame >= c.start && frame <= c.end);
  const chapter = CHAPTERS[index] ?? CHAPTERS[CHAPTERS.length - 1];
  const span = chapter.end - chapter.start || 1;
  return { index, progress: (frame - chapter.start) / span };
}

function buildSvg(frameNumber) {
  const t = (frameNumber - 1) / (FRAME_COUNT - 1);
  const colorA = colorAt(STOPS_A, t);
  const colorB = colorAt(STOPS_B, t);
  const bgIsLight = relativeLuminance(colorA) > 0.55;
  const ringStroke = bgIsLight ? "#241a16" : "#f3ead9";
  const ringFaint = bgIsLight ? "rgba(36,26,22,0.16)" : "rgba(243,234,217,0.16)";

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // The interlocked-rings brand mark: drifts/rotates/scales through the
  // sequence and resolves into a tight, centered mark by the final frame
  // (frame 240 mirrors the static logo — "Your Signature").
  const settle = Math.max(0, (t - 0.82) / 0.18); // 0..1 over the last chapter
  const scale = lerp(1.5, 0.92, settle) * (1 + 0.05 * Math.sin(t * Math.PI * 2.4));
  const rotation = t * 130 + Math.sin(t * Math.PI * 3) * 6;
  const ringR = 150;
  const ringOffset = lerp(96, 58, settle);
  const driftX = lerp(-140, 0, settle) + Math.sin(t * Math.PI * 1.6) * 40 * (1 - settle);
  const driftY = Math.cos(t * Math.PI * 1.3) * 26 * (1 - settle);

  // Aperture/iris motif — abstracts optical precision without a literal
  // eye or glasses. Peaks through Detail/Fit, recedes elsewhere.
  const { index: chapterIndex, progress: chapterT } = chapterLocalProgress(frameNumber);
  const irisPeak = chapterIndex === 2 || chapterIndex === 3;
  const irisOpacity = (irisPeak ? 0.32 : 0.1) * (0.6 + 0.4 * Math.sin(chapterT * Math.PI));
  const irisBlades = 14;
  const irisR1 = 210;
  const irisR2 = 340;
  let irisPaths = "";
  for (let i = 0; i < irisBlades; i++) {
    const a0 = (i / irisBlades) * 360 + rotation * 0.4;
    const a1 = a0 + 10;
    const rad0 = (a0 * Math.PI) / 180;
    const rad1 = (a1 * Math.PI) / 180;
    const x0 = cx + Math.cos(rad0) * irisR1;
    const y0 = cy + Math.sin(rad0) * irisR1;
    const x1 = cx + Math.cos(rad1) * irisR2;
    const y1 = cy + Math.sin(rad1) * irisR2;
    irisPaths += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(
      1
    )}" y2="${y1.toFixed(1)}" stroke="${ringStroke}" stroke-width="2" stroke-linecap="round" opacity="${irisOpacity.toFixed(
      3
    )}" />`;
  }

  // Sweeping light band — only visible through "The Light" chapter (index 4).
  const isLightChapter = chapterIndex === 4;
  const sweepOpacity = isLightChapter ? 0.5 * Math.sin(chapterT * Math.PI) : 0;
  const sweepX = lerp(-WIDTH * 0.6, WIDTH * 1.6, chapterT);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorA}" />
        <stop offset="100%" stop-color="${colorB}" />
      </linearGradient>
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="60%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
      </radialGradient>
      <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="50%" stop-color="#ffffff" stop-opacity="${sweepOpacity.toFixed(3)}" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
    </defs>

    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

    <g opacity="0.5">${irisPaths}</g>

    <g transform="translate(${(cx + driftX).toFixed(1)}, ${(cy + driftY).toFixed(
      1
    )}) rotate(${rotation.toFixed(1)}) scale(${scale.toFixed(3)})">
      <circle cx="${-ringOffset}" cy="0" r="${ringR}" fill="none" stroke="${ringStroke}" stroke-width="10" opacity="0.9" />
      <circle cx="${ringOffset}" cy="0" r="${ringR}" fill="none" stroke="${ringStroke}" stroke-width="10" opacity="0.9" />
      <circle cx="0" cy="0" r="${ringR * 2.35}" fill="none" stroke="${ringFaint}" stroke-width="1.5" />
    </g>

    <rect x="${sweepX.toFixed(1)}" y="-200" width="${WIDTH * 0.5}" height="${HEIGHT + 400}" fill="url(#sweep)" transform="rotate(12 ${cx} ${cy})" />

    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)" />
  </svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${FRAME_COUNT} frames -> ${OUT_DIR}`);

  const concurrency = 8;
  let next = 1;
  let done = 0;

  async function worker() {
    while (next <= FRAME_COUNT) {
      const frameNumber = next++;
      const svg = buildSvg(frameNumber);
      const filename = `frame_${String(frameNumber).padStart(3, "0")}.webp`;
      await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(path.join(OUT_DIR, filename));
      done++;
      if (done % 40 === 0 || done === FRAME_COUNT) {
        console.log(`  ${done}/${FRAME_COUNT}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
