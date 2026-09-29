/**
 * Full-screen preloader whose percentage is the real, decoded-frame
 * count — never a faked/animated number. It tracks progress through the
 * loader's *priority* phase (the frames needed for an immediately smooth
 * first scroll), so it reaches 100% exactly when the experience is ready
 * to reveal, rather than waiting on all 240 frames.
 */
export class Preloader {
  constructor(rootEl, frameLoader, priorityCount) {
    this.rootEl = rootEl;
    this.frameLoader = frameLoader;
    this.priorityCount = priorityCount;
    this.percentEl = rootEl.querySelector("[data-preloader-percent]");
    this.barEl = rootEl.querySelector("[data-preloader-bar]");
    this._lastPercent = -1;
  }

  _renderPercent(percent) {
    if (percent === this._lastPercent) return;
    this._lastPercent = percent;
    if (this.percentEl) this.percentEl.textContent = String(percent).padStart(2, "0");
    if (this.barEl) this.barEl.style.transform = `scaleX(${percent / 100})`;
  }

  /** Resolves once the priority frames are decoded and the fade-out
   * transition has finished. */
  async run() {
    this._renderPercent(0);

    const unsubscribe = this.frameLoader.onProgress((_ratio, loadedCount) => {
      const percent = Math.min(100, Math.round((loadedCount / this.priorityCount) * 100));
      this._renderPercent(percent);
    });

    await this.frameLoader.start();
    unsubscribe();
    this._renderPercent(100);

    await new Promise((r) => setTimeout(r, 220));
    this.rootEl.classList.add("is-hidden");
    this.rootEl.setAttribute("aria-hidden", "true");
    await new Promise((r) => setTimeout(r, 650));
    this.rootEl.remove();
  }
}
