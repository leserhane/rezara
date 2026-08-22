import { TextReveal } from "@/components/ui/TextReveal";
import { Countdown } from "./Countdown";
import { siteConfig } from "@/lib/config/site";

export function OpeningSoon() {
  return (
    <section
      id="opening"
      aria-labelledby="opening-heading"
      className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 py-20 sm:py-28 text-center md:px-12 md:py-48"
    >
      <span className="font-display text-xs uppercase tracking-widest2 text-muted">03 — Status</span>

      <TextReveal
        as="h2"
        text={siteConfig.opening.statusLabel}
        className="font-display mt-6 text-[14vw] font-medium uppercase leading-[0.95] tracking-tight text-secondary-light sm:text-[10vw] md:text-[7vw]"
      />
      <h2 id="opening-heading" className="sr-only">
        {siteConfig.opening.statusLabel}
      </h2>

      <p className="font-display mt-6 text-sm uppercase tracking-widest2 text-secondary md:text-base">
        {siteConfig.location.area}
      </p>

      <p className="font-body mt-10 max-w-lg text-lg font-light italic text-muted md:text-xl">
        A new optical experience is taking shape. No opening date yet — it will be announced here
        first.
      </p>

      <Countdown />

      <p className="font-display mt-14 text-xs font-medium uppercase tracking-widest3 text-secondary md:mt-16">
        Optimum Optic
      </p>
    </section>
  );
}
