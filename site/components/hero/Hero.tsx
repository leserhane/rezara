"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { useIsTouch } from "@/lib/animations/useIsTouch";
import { OpticalLensText } from "@/components/optical-lens/OpticalLensText";
import { Parallax } from "@/components/ui/Parallax";
import { siteConfig } from "@/lib/config/site";

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const openingRef = useRef<HTMLParagraphElement | null>(null);
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const scrollCueRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouch();

  useEffect(() => {
    const { gsap } = useGsap();

    if (reducedMotion) {
      gsap.set([logoRef.current, openingRef.current, scrollCueRef.current], { opacity: 1 });
      return;
    }

    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo(logoRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" })
      .fromTo(
        openingRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        sweepRef.current,
        { xPercent: -130, opacity: 0 },
        { xPercent: 130, opacity: 1, duration: 1.4, ease: "power1.inOut" },
        "-=0.2"
      )
      .set(sweepRef.current, { opacity: 0 })
      .fromTo(scrollCueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.6");

    return () => {
      tl.kill();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || isTouch || !ringRef.current) return;
    const ring = ringRef.current;
    let raf = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    function onMove(event: PointerEvent) {
      targetX = (event.clientX / window.innerWidth) * 2 - 1;
      targetY = (event.clientY / window.innerHeight) * 2 - 1;
    }
    function loop() {
      x += (targetX - x) * 0.05;
      y += (targetY - y) * 0.05;
      ring.style.transform = `translate3d(${x * 22}px, ${y * 22}px, 0) rotate(${x * 3}deg)`;
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion, isTouch]);

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Introduction"
      className="relative flex min-h-[100svh] w-full flex-col justify-center overflow-hidden px-6 md:px-12"
    >
      <Parallax
        speed={0.18}
        className="pointer-events-none absolute -right-[20vw] -top-[10vw] h-[70vw] w-[70vw] max-w-[900px] md:-right-[12vw] md:h-[46vw] md:w-[46vw]"
      >
        <div ref={ringRef} aria-hidden="true" className="h-full w-full opacity-[0.12]">
          <svg viewBox="0 0 200 140" className="h-full w-full">
            <g fill="none" stroke="var(--color-secondary-light)" strokeWidth="4">
              <circle cx="75" cy="70" r="52" />
              <circle cx="122" cy="70" r="52" />
            </g>
          </svg>
        </div>
      </Parallax>

      <div
        ref={sweepRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 20%, rgba(242,226,198,0.18) 50%, transparent 80%)",
        }}
      />

      <div ref={logoRef} className="mb-8 opacity-0 md:mb-10">
        <svg viewBox="0 0 200 140" className="h-12 w-auto md:h-16" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="heroRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f2e2c6" />
              <stop offset="55%" stopColor="#d9c3a6" />
              <stop offset="100%" stopColor="#b7997a" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#heroRingGradient)" strokeWidth="11">
            <circle cx="75" cy="70" r="52" />
            <circle cx="122" cy="70" r="52" />
          </g>
        </svg>
      </div>

      <OpticalLensText
        as="h1"
        text="A New Vision Is Coming."
        className="font-display max-w-5xl text-[12vw] font-medium uppercase leading-[0.95] tracking-tight text-secondary-light sm:text-[10vw] md:text-[6.4vw]"
      />

      <p
        ref={openingRef}
        className="font-display mt-8 text-xs font-medium uppercase tracking-widest3 text-muted opacity-0 md:mt-10 md:text-sm"
      >
        {siteConfig.opening.statusLabel} — {siteConfig.location.area}
      </p>

      <div
        ref={scrollCueRef}
        aria-hidden="true"
        className="absolute bottom-9 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-0 md:bottom-12"
      >
        <span className="font-display text-[10px] uppercase tracking-widest2 text-muted">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-secondary/50 md:h-12" />
      </div>
    </section>
  );
}
