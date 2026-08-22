"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";
import { useGsap } from "./gsap";

const LenisContext = createContext<Lenis | null>(null);

/** Access the active Lenis instance (null under reduced motion, where
 * scrolling is left to the browser). */
export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setLenis(null);
      return;
    }

    const { ScrollTrigger } = useGsap();
    const instance = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    instance.on("scroll", ScrollTrigger.update);

    function raf(time: number) {
      instance.raf(time);
      frameRef.current = requestAnimationFrame(raf);
    }
    frameRef.current = requestAnimationFrame(raf);
    setLenis(instance);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      instance.destroy();
      setLenis(null);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const activeLenis = lenis;
    if (!activeLenis) return;

    function handleAnchorClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      activeLenis!.scrollTo(target as HTMLElement, { offset: -24 });
      history.pushState(null, "", id);
    }

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, [lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
