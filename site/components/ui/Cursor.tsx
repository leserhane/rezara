"use client";

import { useEffect, useRef, useState } from "react";
import { useIsTouch } from "@/lib/animations/useIsTouch";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";

type CursorState = "default" | "link" | "view" | "lens";

const LABELS: Record<CursorState, string> = {
  default: "",
  link: "",
  view: "View",
  lens: "Discover",
};

/** Subtle custom cursor: a small dot that expands and picks up a one-word
 * label over interactive/media elements. Desktop only. */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<CursorState>("default");
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();
  const disabled = isTouch || reducedMotion;

  useEffect(() => {
    if (disabled) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    function onMove(event: PointerEvent) {
      targetX = event.clientX;
      targetY = event.clientY;
      const el = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      setState((el?.dataset.cursor as CursorState) ?? "default");
    }

    function loop() {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [disabled]);

  if (disabled) return null;

  const label = LABELS[state];

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[80] flex items-center justify-center rounded-full mix-blend-difference transition-[width,height] duration-300 ease-out"
      style={{
        width: state === "default" ? 10 : label ? 64 : 36,
        height: state === "default" ? 10 : label ? 64 : 36,
        background: "var(--color-secondary-light)",
      }}
    >
      {label ? (
        <span className="font-display text-[10px] font-medium uppercase tracking-widest text-primary-deep">
          {label}
        </span>
      ) : null}
    </div>
  );
}
