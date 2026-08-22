"use client";

import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline";
}

export function Button({ children, className, variant = "solid", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center gap-3 overflow-hidden px-8 py-4",
        "font-display text-xs font-medium uppercase tracking-widest2 transition-colors duration-300",
        variant === "solid"
          ? "bg-secondary text-primary-deep hover:bg-secondary-light"
          : "border border-secondary text-text hover:border-secondary-light",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-cursor="link"
      {...props}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5"
      >
        →
      </span>
    </button>
  );
}
