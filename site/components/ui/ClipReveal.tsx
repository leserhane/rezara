"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { cn } from "@/lib/utils/cn";

interface ClipRevealProps {
  children: React.ReactNode;
  className?: string;
}

/** Reveals a block as though a shutter were opening — used for the
 * conceptual imagery in Space/Collection instead of a plain fade. */
export function ClipReveal({ children, className }: ClipRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const { gsap, ScrollTrigger } = useGsap();

    const animation = gsap.fromTo(
      ref.current,
      { clipPath: "inset(12% 12% 12% 12%)", scale: 1.08 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        duration: 1.3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          once: true,
        },
      }
    );

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [reducedMotion]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}
