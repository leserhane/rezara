import { Reveal } from "@/components/ui/Reveal";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function EarlyAccess() {
  return (
    <section
      id="early-access"
      aria-labelledby="early-access-heading"
      className="relative px-6 py-20 sm:py-28 md:px-12 md:py-48"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="font-display text-xs uppercase tracking-widest2 text-muted">04 — Early Access</span>
          <h2
            id="early-access-heading"
            className="font-display mt-6 text-[10vw] font-medium uppercase leading-[1.02] tracking-tight text-secondary-light sm:text-[7vw] md:text-[3.6vw]"
          >
            Be the first to know.
          </h2>
          <p className="font-body mx-auto mt-6 max-w-md text-base font-light text-muted md:text-lg">
            Join the Optimum Optic list and be among the first to discover our opening.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 flex justify-center">
          <EarlyAccessForm />
        </Reveal>
      </div>
    </section>
  );
}
