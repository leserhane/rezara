"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { cn } from "@/lib/utils/cn";

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Fraction of the element's own scroll-through distance it drifts by.
   * Positive drifts down slower than the page (background feel), negative
   * drifts up faster (foreground feel). Keep small — this is a texture,
   * not a scene change. */
  speed?: number;
}

/**
 * Scroll-tied drift for decorative elements only (never real content —
 * TextReveal already owns content visibility and its own reliability
 * story). Uses GSAP ScrollTrigger's scrub, which is driven by scroll
 * position polling rather than IntersectionObserver, so it doesn't share
 * the mobile Safari failure mode that hit TextReveal.
 */
export function Parallax({ children, className, speed = 0.15 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const { gsap, ScrollTrigger } = useGsap();

    const animation = gsap.fromTo(
      ref.current,
      { y: () => `${-Math.abs(speed) * 100}%` },
      {
        y: () => `${Math.abs(speed) * 100}%`,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      }
    );

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [reducedMotion, speed]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
