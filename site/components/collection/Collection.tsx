import { Reveal } from "@/components/ui/Reveal";
import { Parallax } from "@/components/ui/Parallax";

const CATEGORIES = [
  { name: "Optical", note: "Precision frames for daily vision." },
  { name: "Sun", note: "Protection with editorial line." },
  { name: "Iconic", note: "Signature shapes, considered." },
  { name: "Contemporary", note: "Where design meets restraint." },
];

export function Collection() {
  return (
    <section
      id="collection"
      aria-labelledby="collection-heading"
      className="relative overflow-hidden px-6 py-20 sm:py-28 md:px-12 md:py-48"
    >
      <Parallax
        speed={0.16}
        className="pointer-events-none absolute -right-[16vw] top-1/3 -z-10 h-[50vw] w-[50vw] max-w-[700px] opacity-[0.07]"
      >
        <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
          <g fill="none" stroke="var(--color-secondary-light)" strokeWidth="3">
            <circle cx="75" cy="70" r="52" />
            <circle cx="122" cy="70" r="52" />
          </g>
        </svg>
      </Parallax>

      <div className="relative mx-auto max-w-5xl">
        <Reveal>
          <span className="font-display text-xs uppercase tracking-widest2 text-muted">02 — The Collection</span>
          <h2
            id="collection-heading"
            className="font-display mt-6 max-w-2xl text-[9vw] font-medium uppercase leading-[1.02] tracking-tight text-secondary-light sm:text-[6vw] md:text-[3vw]"
          >
            The Collection
          </h2>
          <p className="font-body mt-6 max-w-md text-base font-light text-muted md:text-lg">
            A curated selection of eyewear where design, precision and individuality meet.
          </p>
        </Reveal>

        <ul className="mt-16 border-t border-secondary/20 md:mt-24">
          {CATEGORIES.map((category, index) => (
            <Reveal key={category.name} as="li" delay={index * 0.05} y={20}>
              <div className="group flex flex-col justify-between gap-2 border-b border-secondary/20 py-7 transition-colors duration-500 hover:border-secondary/50 md:flex-row md:items-baseline md:gap-8 md:py-9">
                <span className="font-display text-[9vw] font-medium uppercase leading-none tracking-tight text-secondary transition-colors duration-500 group-hover:text-secondary-light sm:text-[6vw] md:text-[3.4vw]">
                  {category.name}
                </span>
                <span className="font-body text-sm font-light text-muted opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:text-base">
                  {category.note}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
