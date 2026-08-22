import { Logo } from "@/components/ui/Logo";
import { TextReveal } from "@/components/ui/TextReveal";
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
    <footer className="relative flex flex-col items-center gap-10 px-6 py-20 sm:py-28 text-center md:py-40">
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
