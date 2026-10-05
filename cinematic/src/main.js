import "./styles/main.css";
import { isWebGLAvailable } from "./three/webgl-check.js";
import { bindScrollStage } from "./utils/scrollStage.js";
import { renderProductCards } from "./components/products.js";
import { initCursor } from "./components/cursor.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reducedMotion) document.documentElement.classList.add("is-reduced-motion");

const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

renderProductCards(document.querySelector("[data-products]"));

const navToggleEl = document.querySelector("[data-nav-toggle]");
const navEl = document.querySelector("[data-nav]");
if (navToggleEl && navEl) {
  navToggleEl.addEventListener("click", () => {
    const open = navEl.classList.toggle("is-open");
    navToggleEl.setAttribute("aria-expanded", String(open));
  });
}

// The scroll hint fades once the page has actually moved — a plain
// show/hide threshold, not an animation driven by scroll position.
const scrollHintEl = document.querySelector("[data-scroll-hint]");
if (scrollHintEl) {
  let hidden = false;
  window.addEventListener(
    "scroll",
    () => {
      if (hidden || window.scrollY <= 80) return;
      hidden = true;
      scrollHintEl.classList.add("is-hidden");
    },
    { passive: true }
  );
}

const heroCanvas = document.querySelector("[data-hero-canvas]");
const scrollStageEl = document.querySelector("[data-scroll-stage]");

if (heroCanvas && scrollStageEl && isWebGLAvailable()) {
  // Three.js (~140KB gzipped) is only worth fetching once we know WebGL
  // actually works here — load it lazily so it never blocks first paint
  // or the rest of the page's interactivity.
  import("./three/HeroScene.js").then(async ({ HeroScene }) => {
    const scene = new HeroScene(heroCanvas);
    try {
      await scene.load();
    } catch (err) {
      // Model failed to fetch/parse: hide the canvas rather than leave a
      // blank/broken WebGL surface sitting over the hero copy.
      console.error("Hero 3D model failed to load:", err);
      heroCanvas.style.display = "none";
      return;
    }

    if (reducedMotion) {
      scene.renderStatic();
      return;
    }

    // Only track scroll and spend GPU time while some part of the
    // 6-chapter stage is actually on screen.
    let unbindScroll = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scene.start();
          if (!unbindScroll) {
            unbindScroll = bindScrollStage(scrollStageEl, (p) => scene.setProgress(p));
          }
        } else {
          scene.pause();
          if (unbindScroll) {
            unbindScroll();
            unbindScroll = null;
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(scrollStageEl);
  });
} else if (heroCanvas) {
  // No WebGL in this browser: hide the canvas and let the hero's own
  // background gradient carry the scene — the headline and copy already
  // convey the brand on their own, nothing is lost but the glasses.
  heroCanvas.style.display = "none";
}

if (!isTouch) initCursor();
