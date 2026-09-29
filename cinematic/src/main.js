import "./styles/main.css";
import { FRAME_COUNT, CHAPTERS, framePath } from "./config.js";
import { FrameLoader } from "./canvas/FrameLoader.js";
import { CanvasRenderer } from "./canvas/CanvasRenderer.js";
import { ScrollController } from "./utils/ScrollController.js";
import { ChapterController } from "./utils/ChapterController.js";
import { Preloader } from "./components/Preloader.js";
import { UIController } from "./components/UIController.js";
import { renderProductCards } from "./components/products.js";
import { initCursor } from "./components/cursor.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reducedMotion) document.documentElement.classList.add("is-reduced-motion");

const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

renderProductCards(document.querySelector("[data-products]"));

const canvas = document.querySelector("[data-cinematic-canvas]");
const track = document.querySelector("[data-cinematic-track]");
const preloaderEl = document.querySelector("[data-preloader]");

const uiController = new UIController({
  chapterRoot: document.querySelector("[data-chapter-root]"),
  progressFillEl: document.querySelector("[data-progress-fill]"),
  chapterCounterEl: document.querySelector("[data-chapter-counter]"),
  chapters: CHAPTERS,
  navToggleEl: document.querySelector("[data-nav-toggle]"),
  navEl: document.querySelector("[data-nav]"),
});

// A representative mid-sequence frame is enough when the full scrub is
// disabled — but the priority count still has to be real so the
// preloader's percentage stays truthful (never a faked number).
const priorityCount = reducedMotion ? 1 : 28;

const frameLoader = new FrameLoader({
  count: FRAME_COUNT,
  pathFor: framePath,
  priorityCount,
});

const renderer = new CanvasRenderer(canvas, frameLoader);

async function boot() {
  const preloader = new Preloader(preloaderEl, frameLoader, priorityCount);
  await preloader.run();

  if (reducedMotion) {
    renderer.renderFrame(Math.round(FRAME_COUNT * 0.5));
    uiController.renderStatic();
    return;
  }

  const chapterController = new ChapterController(CHAPTERS, FRAME_COUNT);
  const scrollController = new ScrollController(track);

  let hasScrolled = false;
  scrollController.onUpdate((progress) => {
    if (!hasScrolled && progress > 0.01) {
      hasScrolled = true;
      track.classList.add("is-scrolled");
    }
    const state = chapterController.getState(progress);
    renderer.renderFrame(state.frame);
    uiController.update(state);
  });

  // Prime the very first frame/chapter immediately, before any scroll.
  const initial = chapterController.getState(0);
  renderer.renderFrame(initial.frame);
  uiController.update(initial);

  if (!isTouch) initCursor();
}

boot();
