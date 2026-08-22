"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { siteConfig } from "@/lib/config/site";

interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function FullscreenMenu({ open, onClose, triggerRef }: FullscreenMenuProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!overlayRef.current) return;
    const { gsap } = useGsap();
    const links = overlayRef.current.querySelectorAll("[data-menu-link]");

    if (open) {
      gsap.set(overlayRef.current, { display: "flex" });
      if (reducedMotion) {
        gsap.set(overlayRef.current, { opacity: 1 });
        gsap.set(links, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
        gsap.fromTo(
          links,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, delay: 0.15, ease: "power3.out" }
        );
      }
      firstLinkRef.current?.focus();
    } else {
      if (reducedMotion) {
        gsap.set(overlayRef.current, { display: "none" });
      } else {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => gsap.set(overlayRef.current, { display: "none" }),
        });
      }
    }
  }, [open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, triggerRef]);

  return (
    <div
      ref={overlayRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      className="fixed inset-0 z-[70] hidden flex-col justify-center bg-background-deep px-8 opacity-0 md:px-20"
    >
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-3">
          {siteConfig.nav.map((item, index) => (
            <li key={item.href} className="overflow-hidden">
              <a
                ref={index === 0 ? firstLinkRef : undefined}
                data-menu-link
                href={item.href}
                onClick={onClose}
                className="font-display inline-block text-[13vw] font-medium uppercase leading-[1.05] tracking-tight text-secondary transition-colors duration-300 hover:text-secondary-light md:text-[5.5vw]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-8 top-8 font-display text-xs uppercase tracking-widest2 text-secondary hover:text-secondary-light md:right-12 md:top-10"
      >
        Close
      </button>
    </div>
  );
}
