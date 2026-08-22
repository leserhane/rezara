import { Logo } from "@/components/ui/Logo";
import { TextReveal } from "@/components/ui/TextReveal";
import { Parallax } from "@/components/ui/Parallax";
import { siteConfig } from "@/lib/config/site";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

export function Footer() {
  const socials = Object.entries(siteConfig.social).filter(
    ([key, value]) => value && key in SOCIAL_LABELS
  ) as Array<[keyof typeof SOCIAL_LABELS, string]>;

  return (
    <footer className="relative flex flex-col items-center gap-10 overflow-hidden px-6 py-20 sm:py-28 text-center md:py-40">
      <Parallax
        speed={0.15}
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70vw] w-[70vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      >
        <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
          <g fill="none" stroke="var(--color-secondary-light)" strokeWidth="2.5">
            <circle cx="75" cy="70" r="52" />
            <circle cx="122" cy="70" r="52" />
          </g>
        </svg>
      </Parallax>

      <Logo className="h-10 w-auto opacity-90 md:h-12" />

      <TextReveal
        as="h2"
        text="See you soon."
        className="font-display text-[12vw] font-medium uppercase leading-none tracking-tight text-secondary-light sm:text-[8vw] md:text-[5vw]"
      />

      <div className="font-display text-sm uppercase tracking-widest2 text-secondary md:text-base">
        Optimum Optic
        <span className="mx-3 text-muted">·</span>
        {siteConfig.location.area.replace(",", " ·").toUpperCase()}
      </div>

      {socials.length > 0 ? (
        <nav aria-label="Social links" className="flex gap-8">
          {socials.map(([key, href]) => (
            <a
              key={key}
              href={href}
              className="font-display text-xs uppercase tracking-widest2 text-muted transition-colors hover:text-secondary-light"
              data-cursor="link"
              target="_blank"
              rel="noreferrer"
            >
              {SOCIAL_LABELS[key]}
            </a>
          ))}
        </nav>
      ) : null}

      <p className="font-body mt-6 text-xs font-light text-muted/70">
        © {new Date().getFullYear()} Optimum Optic. All rights reserved.
      </p>
    </footer>
  );
}
