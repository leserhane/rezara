"use client";

import { useEffect, useRef, useState } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useIsTouch } from "@/lib/animations/useIsTouch";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { cn } from "@/lib/utils/cn";

interface OpticalLensTextProps {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  lensRadius?: number;
}

/**
 * Signature interaction (brief §8): on a precise pointer, text behind the
 * cursor reads as though seen through a lens — a touch sharper, a touch
 * larger. On touch devices there is no cursor to borrow, so the same
 * sharpening plays once as a scroll-linked sweep instead.
 */
export function OpticalLensText({ text, as = "h2", className, lensRadius = 130 }: OpticalLensTextProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sharpRef = useRef<HTMLSpanElement | null>(null);
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const useCursorLens = ready && !isTouch && !reducedMotion;
  const useScrollSweep = ready && (isTouch || reducedMotion) && !reducedMotion;

  useEffect(() => {
    if (!useCursorLens || !wrapRef.current || !sharpRef.current) return;
    const el = wrapRef.current;
    const sharp = sharpRef.current;
    let raf = 0;
    let x = -1000;
    let y = -1000;
    let targetX = -1000;
    let targetY = -1000;

    function onMove(event: PointerEvent) {
      const rect = el.getBoundingClientRect();
      targetX = event.clientX - rect.left;
      targetY = event.clientY - rect.top;
    }
    function onLeave() {
      targetX = -1000;
      targetY = -1000;
    }

    function loop() {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      sharp.style.clipPath = `circle(${lensRadius}px at ${x}px ${y}px)`;
      raf = requestAnimationFrame(loop);
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [useCursorLens, lensRadius]);

  useEffect(() => {
    if (!useScrollSweep || !wrapRef.current) return;
    const { gsap, ScrollTrigger } = useGsap();
    const animation = gsap.fromTo(
      wrapRef.current,
      { filter: "blur(7px)", scale: 1.015, opacity: 0.75 },
      {
        filter: "blur(0px)",
        scale: 1,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top 88%",
          end: "top 45%",
          scrub: 0.6,
        },
      }
    );
    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [useScrollSweep]);

  const Tag = as;

  return (
    <div ref={wrapRef} className="relative inline-block" data-cursor="lens">
      <Tag className={cn(className, !useCursorLens && "will-change-[filter,transform]")}>
        {text}
      </Tag>
      {useCursorLens ? (
        <Tag
          ref={sharpRef as never}
          aria-hidden="true"
          className={cn(className, "absolute inset-0 text-secondary-light")}
          style={{ clipPath: "circle(0px at -1000px -1000px)" }}
        >
          {text}
        </Tag>
      ) : null}
    </div>
  );
}
