"use client";

import { useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { FullscreenMenu } from "./FullscreenMenu";

export function Navigation() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
      <a href="#top" className="flex items-center gap-3" data-cursor="link" aria-label="Optimum Optic — home">
        <Logo className="h-8 w-auto md:h-9" />
      </a>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-menu"
        data-cursor="link"
        className="font-display text-xs font-medium uppercase tracking-widest2 text-secondary transition-colors duration-300 hover:text-secondary-light"
      >
        {open ? "Close" : "Menu"}
      </button>

      <FullscreenMenu open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />
    </header>
  );
}
