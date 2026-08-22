"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";

interface TextRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  className?: string;
  wordClassName?: string;
}

/**
 * Word-by-word mask reveal, triggered once the text scrolls into view.
 * Plain CSS transitions + IntersectionObserver rather than a scroll-driven
 * tween — simpler to reason about and just as GPU-cheap (transform/opacity
 * only), and avoids tying a one-shot reveal to ongoing scroll position.
 */
export function TextReveal({ text, as = "p", delay = 0, className, wordClassName }: TextRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const words = text.split(" ");

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const Tag = as;

  return (
    <Tag ref={containerRef as never} className={className} aria-label={text}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden align-bottom" aria-hidden="true">
            <span
              data-word
              style={{ transitionDelay: `${delay * 1000 + index * 45}ms` }}
              className={`inline-block transition-[transform,opacity] duration-700 ease-out will-change-transform ${
                visible || reducedMotion ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              } ${wordClassName ?? ""}`}
            >
              {word}
            </span>
          </span>
          {index < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
