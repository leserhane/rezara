/**
 * Progressive frame loader: decodes WebP frames off the main thread's
 * paint path (via HTMLImageElement.decode()) with a frame cache, a
 * priority-first strategy, bounded concurrency, and graceful failure
 * handling — a broken/slow frame never blocks the sequence or shows a
 * broken-image icon; the renderer just keeps the nearest frame that did
 * load until the real one arrives.
 */
export class FrameLoader {
  /**
   * @param {object} opts
   * @param {number} opts.count - total frame count
   * @param {(index: number) => string} opts.pathFor - frame index -> URL
   * @param {number} [opts.priorityCount] - frames decoded before start() resolves
   * @param {number} [opts.concurrency] - simultaneous decode operations
   * @param {number} [opts.maxRetries] - retry attempts per frame before giving up
   */
  constructor({ count, pathFor, priorityCount = 24, concurrency = 6, maxRetries = 2 }) {
    this.count = count;
    this.pathFor = pathFor;
    this.priorityCount = Math.min(priorityCount, count);
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;

    /** @type {Map<number, HTMLImageElement>} */
    this.cache = new Map();
    /** @type {Map<number, Promise<HTMLImageElement|null>>} */
    this.inFlight = new Map();
    this.permanentlyFailed = new Set();
    this.loadedCount = 0;
    this.destroyed = false;
    this._progressListeners = new Set();
  }

  get progress() {
    return this.count === 0 ? 1 : this.loadedCount / this.count;
  }

  onProgress(fn) {
    this._progressListeners.add(fn);
    return () => this._progressListeners.delete(fn);
  }

  _emitProgress() {
    for (const fn of this._progressListeners) fn(this.progress, this.loadedCount, this.count);
  }

  /** 1-based frame index -> decoded <img>, or null if never attempted. */
  getFrame(index) {
    return this.cache.get(index) ?? null;
  }

  /** Nearest already-decoded frame to `index` — used so the canvas always
   * has *something* to draw even mid-load or after a permanent failure. */
  getNearestFrame(index) {
    if (this.cache.has(index)) return this.cache.get(index);
    for (let d = 1; d < this.count; d++) {
      const before = index - d;
      const after = index + d;
      if (before >= 1 && this.cache.has(before)) return this.cache.get(before);
      if (after <= this.count && this.cache.has(after)) return this.cache.get(after);
    }
    return null;
  }

  async _decodeOne(index, attempt = 0) {
    if (this.destroyed) return null;
    if (this.cache.has(index)) return this.cache.get(index);

    const img = new Image();
    img.decoding = "async";
    img.src = this.pathFor(index);

    try {
      if (typeof img.decode === "function") {
        await img.decode();
      } else {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }
      if (this.destroyed) return null;
      this.cache.set(index, img);
      this.loadedCount++;
      this._emitProgress();
      return img;
    } catch {
      if (attempt < this.maxRetries) {
        await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
        return this._decodeOne(index, attempt + 1);
      }
      // Give up on this frame, but still count it toward progress so the
      // preloader can never hang on a single bad file.
      this.permanentlyFailed.add(index);
      this.loadedCount++;
      this._emitProgress();
      return null;
    }
  }

  async _loadIndex(index) {
    if (this.cache.has(index) || this.permanentlyFailed.has(index)) return;
    if (this.inFlight.has(index)) return this.inFlight.get(index);
    const promise = this._decodeOne(index).finally(() => this.inFlight.delete(index));
    this.inFlight.set(index, promise);
    return promise;
  }

  async _runQueue(indices, concurrency) {
    let cursor = 0;
    const workers = Array.from({ length: Math.min(concurrency, indices.length) }, async () => {
      while (cursor < indices.length && !this.destroyed) {
        const index = indices[cursor++];
        await this._loadIndex(index);
      }
    });
    await Promise.all(workers);
  }

  /**
   * Phase 1: decode the first `priorityCount` frames (blocking — the
   * returned promise resolves once the experience is safe to reveal).
   * Phase 2: decode every remaining frame in the background, never
   * blocking the caller.
   */
  async start() {
    const priorityIndices = Array.from({ length: this.priorityCount }, (_, i) => i + 1);
    await this._runQueue(priorityIndices, this.concurrency);

    const remaining = [];
    for (let i = this.priorityCount + 1; i <= this.count; i++) remaining.push(i);
    // Fire and forget — UI is already interactive at this point.
    this._runQueue(remaining, this.concurrency).catch(() => {});
  }

  /** Bump a specific frame to the front of the queue (e.g. the frame the
   * user is scrubbing toward right now but hasn't reached yet). */
  prioritize(index) {
    if (!this.cache.has(index) && !this.permanentlyFailed.has(index)) {
      this._loadIndex(index).catch(() => {});
    }
  }

  destroy() {
    this.destroyed = true;
    this._progressListeners.clear();
    this.cache.clear();
    this.inFlight.clear();
  }
}
