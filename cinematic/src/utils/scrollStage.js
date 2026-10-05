/**
 * Maps how far the visitor has scrolled through `stageEl` to a plain
 * 0-1 number via `onProgress` — 0 while its top is at the top of the
 * viewport, 1 once it's scrolled past by its own extra height (i.e. by
 * `stageEl`'s height minus one viewport, the part a sticky child inside
 * it can actually pin through). Pure native scroll: this only reads
 * position on scroll/resize (rAF-throttled), it never hijacks the
 * wheel/touch or changes where the page actually scrolls to.
 */
export function bindScrollStage(stageEl, onProgress) {
  let queued = false;

  const measure = () => {
    queued = false;
    const rect = stageEl.getBoundingClientRect();
    const scrollable = stageEl.offsetHeight - window.innerHeight;
    const progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
    onProgress(progress);
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(measure);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  measure();

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
