"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "article" | "li";
}

/** Fade + rise reveal for supporting imagery/blocks as they enter view. */
export function Reveal({
  children,
  className,
  y = 32,
  delay = 0,
  duration = 1,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const { gsap, ScrollTrigger } = useGsap();

    const animation = gsap.fromTo(
      ref.current,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      }
    );

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [reducedMotion, y, delay, duration]);

  const Tag = as;

  return (
    <Tag ref={ref as never} className={cn(reducedMotion ? "" : "opacity-0", className)}>
      {children}
    </Tag>
  );
}
