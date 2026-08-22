"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/animations/gsap";
import { useReducedMotion } from "@/lib/animations/useReducedMotion";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function FullscreenMenu({ open, onClose, triggerRef }: FullscreenMenuProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const reducedMotion = useReducedMotion();

  /**
   * Visibility is plain React state driving Tailwind classes — it must
   * work even if GSAP fails to load/execute for any reason. GSAP below is
   * purely a decorative stagger on top of that, never load-bearing.
   */
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    if (reducedMotion || !overlayRef.current) return;

    const { gsap } = useGsap();
    const links = overlayRef.current.querySelectorAll("[data-menu-link]");
    const animation = gsap.fromTo(
      links,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, delay: 0.15, ease: "power3.out" }
    );
    return () => {
      animation.kill();
    };
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
      aria-hidden={!open}
      aria-label="Site navigation"
      className={cn(
        "fixed inset-0 z-[70] flex flex-col justify-center bg-background-deep px-8 transition-opacity duration-300 md:px-20",
        open ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
      )}
    >
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-3">
          {siteConfig.nav.map((item, index) => (
            <li key={item.href} className="overflow-hidden">
              <a
                ref={index === 0 ? firstLinkRef : undefined}
                data-menu-link
                href={item.href}
                tabIndex={open ? 0 : -1}
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
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className="absolute right-8 top-8 font-display text-xs uppercase tracking-widest2 text-secondary hover:text-secondary-light md:right-12 md:top-10"
      >
        Close
      </button>
    </div>
  );
}
