"use client";

import { useEffect, useState } from "react";

/** True for touch/coarse-pointer devices — used to swap cursor-driven
 * interactions for scroll/touch-driven equivalents. */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    setIsTouch(query.matches);
    const listener = (event: MediaQueryListEvent) => setIsTouch(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return isTouch;
}
