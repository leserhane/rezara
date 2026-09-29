/**
 * DPR-aware, "object-fit: cover"-style canvas renderer for the frame
 * sequence. The canvas is never the scroll container — something else
 * (ScrollController) measures scroll and tells this renderer which frame
 * to show.
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import("./FrameLoader.js").FrameLoader} frameLoader
   */
  constructor(canvas, frameLoader) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.frameLoader = frameLoader;
    this.currentIndex = -1;
    this.cssWidth = 0;
    this.cssHeight = 0;
    this.dpr = 1;

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    // Measure the canvas's own box, not its parent's: in the normal
    // (motion-enabled) layout the canvas is `position: absolute; inset:
    // 0`, so its box already equals its sticky container's box; in the
    // reduced-motion fallback the canvas instead has its own explicit
    // height and sits above much taller stacked chapter text, so the
    // parent's box is no longer a meaningful size to draw at.
    const rect = this.canvas.getBoundingClientRect();
    this.cssWidth = Math.max(1, Math.round(rect.width));
    this.cssHeight = Math.max(1, Math.round(rect.height));
    // Cap DPR: decoding+drawing 240 frames at true 3x on a large phone
    // screen buys no visible sharpness for this content and burns memory.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(this.cssWidth * this.dpr);
    this.canvas.height = Math.round(this.cssHeight * this.dpr);
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Force a redraw at the new size.
    const index = this.currentIndex;
    this.currentIndex = -1;
    if (index > 0) this.renderFrame(index);
  }

  /** Returns the best available image for `index` (exact if decoded,
   * otherwise the nearest decoded neighbor) and nudges the loader to
   * fetch the exact one if it's missing. */
  loadFrame(index) {
    const exact = this.frameLoader.getFrame(index);
    if (exact) return exact;
    this.frameLoader.prioritize(index);
    return this.frameLoader.getNearestFrame(index);
  }

  renderFrame(index) {
    if (index === this.currentIndex) return;
    const image = this.loadFrame(index);
    if (!image) return; // nothing decoded yet anywhere — keep last paint

    const { ctx, cssWidth: cw, cssHeight: ch } = this;
    const scale = Math.max(cw / image.naturalWidth, ch / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offsetX = (cw - drawWidth) / 2;
    const offsetY = (ch - drawHeight) / 2;

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    this.currentIndex = index;
  }

  destroy() {
    this._resizeObserver.disconnect();
  }
}
