import { CHAPTERS, FRAME_COUNT } from "../config.js";

/**
 * Maps overall scroll progress (0..1) to a frame index and the current
 * editorial chapter, plus that chapter's own local progress (0..1) for
 * driving text transitions.
 */
export class ChapterController {
  constructor(chapters = CHAPTERS, frameCount = FRAME_COUNT) {
    this.chapters = chapters;
    this.frameCount = frameCount;
  }

  frameForProgress(progress) {
    const clamped = Math.min(1, Math.max(0, progress));
    return Math.floor(clamped * (this.frameCount - 1)) + 1;
  }

  getState(progress) {
    const frame = this.frameForProgress(progress);
    const chapterIndex = this.chapters.findIndex((c) => frame >= c.start && frame <= c.end);
    const index = chapterIndex === -1 ? this.chapters.length - 1 : chapterIndex;
    const chapter = this.chapters[index];
    const span = chapter.end - chapter.start || 1;
    const localProgress = Math.min(1, Math.max(0, (frame - chapter.start) / span));

    return { frame, chapterIndex: index, chapter, localProgress };
  }
}
