import { Reveal } from "@/components/ui/Reveal";
import { ClipReveal } from "@/components/ui/ClipReveal";
import { Parallax } from "@/components/ui/Parallax";

export function Space() {
  return (
    <section
      id="space"
      aria-labelledby="space-heading"
      className="relative overflow-hidden px-6 py-20 sm:py-28 md:px-12 md:py-48"
    >
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <Reveal>
            <span className="font-display text-xs uppercase tracking-widest2 text-muted">01 — The Space</span>
            <h2
              id="space-heading"
              className="font-display mt-6 text-[9vw] font-medium uppercase leading-[1.02] tracking-tight text-secondary-light sm:text-[6vw] md:text-[3vw]"
            >
              A new space
              <br />
              for vision.
            </h2>
            <p className="font-body mt-8 max-w-sm text-base font-light text-muted md:text-lg">
              Near Rabat, a store is taking shape around precision, material and light — designed
              the way an optical instrument is designed: with intent, in every detail.
            </p>
          </Reveal>
        </div>

        <div className="relative md:col-span-7">
          <ClipReveal className="relative aspect-[4/5] w-full max-w-xl md:aspect-[16/11]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(155deg, var(--color-primary-deep) 0%, var(--color-primary) 55%, #7d2f3c 100%)",
              }}
            />
            <Parallax speed={0.12} className="absolute -right-10 -top-10 h-2/3 w-2/3 opacity-25">
              <svg viewBox="0 0 200 140" className="h-full w-full" aria-hidden="true">
                <g fill="none" stroke="var(--color-secondary-light)" strokeWidth="2.5">
                  <circle cx="75" cy="70" r="52" />
                  <circle cx="122" cy="70" r="52" />
                </g>
              </svg>
            </Parallax>
            <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
              <line x1="0" y1="30%" x2="100%" y2="30%" stroke="var(--color-secondary)" strokeWidth="1" />
              <line x1="18%" y1="0" x2="18%" y2="100%" stroke="var(--color-secondary)" strokeWidth="1" />
              <line x1="0" y1="72%" x2="60%" y2="72%" stroke="var(--color-secondary)" strokeWidth="1" />
            </svg>
            <span className="absolute bottom-6 left-6 font-display text-[10px] uppercase tracking-widest2 text-muted md:bottom-8 md:left-8">
              Material · Light · Precision
            </span>
          </ClipReveal>
        </div>
      </div>
    </section>
  );
}
