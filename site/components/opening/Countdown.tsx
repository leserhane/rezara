"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config/site";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: string): TimeLeft {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/**
 * Renders nothing until `siteConfig.opening.date` is set — per the brief,
 * there is no countdown until a real opening date exists. Once a date is
 * added, this activates automatically; no other component needs to change.
 */
export function Countdown() {
  const date = siteConfig.opening.date;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(date ? getTimeLeft(date) : null);

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date || !timeLeft) return null;

  const units: Array<[string, number]> = [
    ["Days", timeLeft.days],
    ["Hours", timeLeft.hours],
    ["Minutes", timeLeft.minutes],
    ["Seconds", timeLeft.seconds],
  ];

  return (
    <div className="mt-12 flex gap-8 md:gap-12" role="timer" aria-live="polite">
      {units.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-display text-4xl font-medium text-secondary-light md:text-6xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="font-display mt-2 text-[10px] uppercase tracking-widest2 text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
