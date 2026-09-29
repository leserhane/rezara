/**
 * Owns everything that isn't the canvas itself: chapter text crossfades,
 * the thin progress indicator, the chapter counter, and the mobile nav
 * toggle. All transitions are plain CSS (opacity/transform/letter-
 * spacing) driven by a couple of class/attribute writes per scroll tick
 * — no per-frame inline style animation loop.
 */
export class UIController {
  constructor({ chapterRoot, progressFillEl, chapterCounterEl, chapters, navToggleEl, navEl }) {
    this.chapterRoot = chapterRoot;
    this.progressFillEl = progressFillEl;
    this.chapterCounterEl = chapterCounterEl;
    this.chapters = chapters;
    this.navToggleEl = navToggleEl;
    this.navEl = navEl;

    this._activeIndex = -1;
    this._buildChapters();
    this._wireNav();
  }

  _buildChapters() {
    this.chapterRoot.innerHTML = "";
    this._chapterEls = this.chapters.map((chapter, i) => {
      const el = document.createElement("article");
      el.className = "chapter";
      el.dataset.chapterId = chapter.id;
      el.setAttribute("aria-hidden", i === 0 ? "false" : "true");

      const eyebrow = chapter.tag
        ? `<p class="chapter__eyebrow">${chapter.tag} <span>· ${chapter.tagline ?? ""}</span></p>`
        : `<p class="chapter__eyebrow">${chapter.label} — ${chapter.title}</p>`;

      const heading = chapter.heading
        .map((line) => `<span class="chapter__line">${line}</span>`)
        .join("");

      const body = chapter.body ? `<p class="chapter__body">${chapter.body}</p>` : "";
      const cta = chapter.cta
        ? `<a class="chapter__cta" href="#collection" data-cursor="link">${chapter.cta}<span aria-hidden="true">→</span></a>`
        : "";

      el.innerHTML = `${eyebrow}<h2 class="chapter__heading">${heading}</h2>${body}${cta}`;
      this.chapterRoot.appendChild(el);
      return el;
    });
  }

  _wireNav() {
    if (!this.navToggleEl || !this.navEl) return;
    this.navToggleEl.addEventListener("click", () => {
      const open = this.navEl.classList.toggle("is-open");
      this.navToggleEl.setAttribute("aria-expanded", String(open));
    });
  }

  /** @param {{chapterIndex:number, chapter:object, localProgress:number, frame:number}} state */
  update(state) {
    if (state.chapterIndex !== this._activeIndex) {
      this._activeIndex = state.chapterIndex;
      this._chapterEls.forEach((el, i) => {
        const active = i === state.chapterIndex;
        el.classList.toggle("is-active", active);
        el.setAttribute("aria-hidden", String(!active));
      });
      if (this.chapterCounterEl) {
        const total = String(this.chapters.length).padStart(2, "0");
        const current = String(state.chapterIndex + 1).padStart(2, "0");
        this.chapterCounterEl.textContent = `${current} / ${total}`;
      }
    }

    const activeEl = this._chapterEls[state.chapterIndex];
    if (activeEl) {
      // The very first chapter starts already on screen at page load —
      // there is no scroll-in moment for it, so it must read as fully
      // "entered" immediately rather than waiting for the user to scroll
      // a few frames into it. Every other chapter keeps the real,
      // scroll-linked local progress for its entrance.
      const displayProgress =
        state.chapterIndex === 0 ? Math.max(state.localProgress, 0.4) : state.localProgress;
      activeEl.style.setProperty("--local-progress", displayProgress.toFixed(3));
    }

    if (this.progressFillEl) {
      const overall = (state.frame - 1) / 239;
      this.progressFillEl.style.transform = `scaleX(${overall})`;
    }
  }

  /** Reduced-motion fallback: render every chapter statically, all
   * visible, in normal document flow — no crossfade, nothing hidden. */
  renderStatic() {
    this._chapterEls.forEach((el) => {
      el.classList.add("is-active");
      el.setAttribute("aria-hidden", "false");
    });
  }
}
