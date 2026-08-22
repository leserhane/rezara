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
 *
 * Mobile Safari has been observed to never fire the IntersectionObserver
 * callback for some large, centered headings (leaving them permanently at
 * opacity:0) — so this backs the observer with a manual scroll/resize
 * bounding-rect check and an immediate on-mount check. Any one of the
 * three firing is enough; whichever wins, the others are torn down.
 * Content must never stay invisible just because one reveal mechanism
 * didn't fire on a given device.
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

    let done = false;
    function reveal() {
      if (done) return;
      done = true;
      setVisible(true);
      cleanup();
    }

    function checkPosition() {
      const rect = el!.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.05 && rect.bottom > 0) reveal();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) reveal();
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    observer.observe(el);

    window.addEventListener("scroll", checkPosition, { passive: true });
    window.addEventListener("resize", checkPosition);
    checkPosition();

    function cleanup() {
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    }

    return cleanup;
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
