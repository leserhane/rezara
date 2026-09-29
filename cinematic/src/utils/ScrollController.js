/**
 * Turns physical scroll position over a tall "track" element into a 0..1
 * progress value. The track is the scroll container conceptually, but it
 * is a normal document-flow element (tall section) — nothing hijacks
 * native scrolling, there's no scroll-jacking and no smooth-scroll
 * library; the canvas is pinned over it with plain CSS `position: sticky`.
 *
 * Work only happens while the track is anywhere near the viewport
 * (IntersectionObserver), and only on ticks where the scroll position
 * actually changed (a `dirty` flag set by a passive scroll listener) —
 * so this never spins an idle rAF loop for a section the user has
 * scrolled far past.
 */
export class ScrollController {
  constructor(trackElement) {
    this.trackElement = trackElement;
    this.progress = 0;
    this._active = false;
    this._dirty = true;
    this._rafId = 0;
    this._listeners = new Set();

    this._onScroll = () => {
      this._dirty = true;
    };
    this._onResize = () => {
      this._dirty = true;
    };

    this._io = new IntersectionObserver(
      ([entry]) => {
        this._active = entry.isIntersecting;
        if (this._active) {
          this._dirty = true;
          this._startLoop();
        }
      },
      { rootMargin: "50% 0px 50% 0px" }
    );
    this._io.observe(trackElement);

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });
  }

  onUpdate(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  getProgress() {
    return this.progress;
  }

  _computeProgress() {
    const rect = this.trackElement.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return rect.top <= 0 ? 1 : 0;
    const raw = -rect.top / scrollable;
    return Math.min(1, Math.max(0, raw));
  }

  _startLoop() {
    if (this._rafId) return;
    const tick = () => {
      if (!this._active) {
        this._rafId = 0;
        return;
      }
      if (this._dirty) {
        this._dirty = false;
        const next = this._computeProgress();
        if (next !== this.progress) {
          this.progress = next;
          for (const fn of this._listeners) fn(this.progress);
        }
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  destroy() {
    this._active = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._io.disconnect();
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("resize", this._onResize);
    this._listeners.clear();
  }
}
