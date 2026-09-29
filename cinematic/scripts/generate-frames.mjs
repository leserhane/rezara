/**
 * Generates 240 placeholder cinematic frames: an exploded-view optical
 * frame (temples, rims, bridge, hinges) that assembles into a complete
 * pair of glasses across the sequence — an original line-art illustration,
 * never a copied/scraped product photo (see cinematic/README.md for why).
 * A small interlocked-rings watermark keeps it tied to the brand mark.
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

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Assembly progress: the frame is fully exploded at t=0 and fully
  // assembled by ~85% through the sequence, then holds together for the
  // "Your Signature" chapter — parts arriving and resolving into a
  // finished, confident pair of glasses.
  const assembleRaw = Math.min(1, t / 0.85);
  const assemble = assembleRaw * assembleRaw * (3 - 2 * assembleRaw); // smoothstep
  const explode = 1 - assemble;

  const { index: chapterIndex, progress: chapterT } = chapterLocalProgress(frameNumber);

  const lensR = 92;
  const metalStroke = bgIsLight ? "#241a16" : "#f3ead9";
  const glassTint = bgIsLight ? "rgba(36,26,22,0.05)" : "rgba(243,234,217,0.07)";
  const hingeAccent = "#b8a98c";

  const lx = cx - 118 - explode * 300;
  const ly = cy - explode * 210 + Math.sin(t * Math.PI * 2.2) * 4 * explode;
  const rx = cx + 118 + explode * 300;
  const ry = cy - explode * 160 + Math.cos(t * Math.PI * 2.1) * 4 * explode;

  const hingeLx = lx - lensR * 0.94;
  const hingeLy = ly;
  const hingeRx = rx + lensR * 0.94;
  const hingeRy = ry;

  const templeBendLx = hingeLx - 90 - explode * 170;
  const templeBendLy = hingeLy + 6 + explode * 110;
  const templeEndLx = templeBendLx - 130 - explode * 220;
  const templeEndLy = templeBendLy + 8 + explode * 170;

  const templeBendRx = hingeRx + 90 + explode * 170;
  const templeBendRy = hingeRy + 6 + explode * 110;
  const templeEndRx = templeBendRx + 130 + explode * 220;
  const templeEndRy = templeBendRy + 8 + explode * 170;

  const bridgeY = cy - 34 - explode * 340;
  const bridgeSpan = Math.max(4, (rx - lensR) - (lx + lensR)) / 2;

  const glassesGroup = `
    <g stroke="${metalStroke}" stroke-width="6" fill="none" stroke-linecap="round" opacity="${(0.55 + 0.45 * assemble).toFixed(3)}">
      <path d="M ${hingeLx.toFixed(1)} ${hingeLy.toFixed(1)} L ${templeBendLx.toFixed(1)} ${templeBendLy.toFixed(1)} L ${templeEndLx.toFixed(1)} ${templeEndLy.toFixed(1)}" />
      <path d="M ${hingeRx.toFixed(1)} ${hingeRy.toFixed(1)} L ${templeBendRx.toFixed(1)} ${templeBendRy.toFixed(1)} L ${templeEndRx.toFixed(1)} ${templeEndRy.toFixed(1)}" />
    </g>
    <path d="M ${(cx - bridgeSpan).toFixed(1)} ${(bridgeY + 14).toFixed(1)} Q ${cx} ${bridgeY.toFixed(1)} ${(cx + bridgeSpan).toFixed(1)} ${(bridgeY + 14).toFixed(1)}"
      stroke="${metalStroke}" stroke-width="6" fill="none" stroke-linecap="round" opacity="${(0.5 + 0.5 * assemble).toFixed(3)}" />
    <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${lensR}" fill="${glassTint}" stroke="${metalStroke}" stroke-width="7" opacity="0.95" />
    <circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="${lensR}" fill="${glassTint}" stroke="${metalStroke}" stroke-width="7" opacity="0.95" />
    <path d="M ${(lx - lensR * 0.4).toFixed(1)} ${(ly - lensR * 0.55).toFixed(1)} A ${lensR * 0.8} ${lensR * 0.8} 0 0 1 ${(lx + lensR * 0.35).toFixed(1)} ${(ly - lensR * 0.68).toFixed(1)}"
      stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.18" />
    <path d="M ${(rx - lensR * 0.4).toFixed(1)} ${(ry - lensR * 0.55).toFixed(1)} A ${lensR * 0.8} ${lensR * 0.8} 0 0 1 ${(rx + lensR * 0.35).toFixed(1)} ${(ry - lensR * 0.68).toFixed(1)}"
      stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.18" />
    <circle cx="${hingeLx.toFixed(1)}" cy="${hingeLy.toFixed(1)}" r="7" fill="${hingeAccent}" opacity="${(0.6 + 0.4 * assemble).toFixed(3)}" />
    <circle cx="${hingeRx.toFixed(1)}" cy="${hingeRy.toFixed(1)}" r="7" fill="${hingeAccent}" opacity="${(0.6 + 0.4 * assemble).toFixed(3)}" />
    <circle cx="${hingeLx.toFixed(1)}" cy="${(hingeLy - 10).toFixed(1)}" r="2" fill="${hingeAccent}" opacity="${(0.5 + 0.5 * assemble).toFixed(3)}" />
    <circle cx="${hingeRx.toFixed(1)}" cy="${(hingeRy - 10).toFixed(1)}" r="2" fill="${hingeAccent}" opacity="${(0.5 + 0.5 * assemble).toFixed(3)}" />
  `;

  // Small interlocked-rings watermark, corner-anchored, ties the frame
  // back to the brand mark without competing with the glasses.
  const markR = 46;
  const markCx = WIDTH - 150;
  const markCy = HEIGHT - 130;
  const brandMark = `
    <g stroke="${metalStroke}" stroke-width="3.5" fill="none" opacity="0.4">
      <circle cx="${markCx - 26}" cy="${markCy}" r="${markR}" />
      <circle cx="${markCx + 26}" cy="${markCy}" r="${markR}" />
    </g>
  `;

  // Aperture/iris motif — abstracts optical precision, layered behind the
  // glasses. Peaks through Detail/Fit, recedes elsewhere.
  const irisPeak = chapterIndex === 2 || chapterIndex === 3;
  const irisOpacity = (irisPeak ? 0.28 : 0.08) * (0.6 + 0.4 * Math.sin(chapterT * Math.PI));
  const irisBlades = 14;
  const irisR1 = 260;
  const irisR2 = 400;
  const irisRotation = t * 90;
  let irisPaths = "";
  for (let i = 0; i < irisBlades; i++) {
    const a0 = (i / irisBlades) * 360 + irisRotation;
    const a1 = a0 + 10;
    const rad0 = (a0 * Math.PI) / 180;
    const rad1 = (a1 * Math.PI) / 180;
    const x0 = cx + Math.cos(rad0) * irisR1;
    const y0 = cy + Math.sin(rad0) * irisR1;
    const x1 = cx + Math.cos(rad1) * irisR2;
    const y1 = cy + Math.sin(rad1) * irisR2;
    irisPaths += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(
      1
    )}" y2="${y1.toFixed(1)}" stroke="${metalStroke}" stroke-width="2" stroke-linecap="round" opacity="${irisOpacity.toFixed(
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

    ${glassesGroup}

    ${brandMark}

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
