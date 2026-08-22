import { TextReveal } from "@/components/ui/TextReveal";

const LINES = [
  "It is how you perceive.",
  "How you express yourself.",
  "How you see the world.",
  "And how the world sees you.",
];

export function Manifesto() {
  return (
    <section id="vision" aria-labelledby="vision-heading" className="relative px-6 py-20 sm:py-28 md:px-12 md:py-48">
      <div className="mx-auto max-w-4xl">
        <TextReveal
          as="h2"
          text="Vision is more than what you see."
          className="font-display text-[9vw] font-medium uppercase leading-[1.05] tracking-tight text-secondary-light sm:text-[7vw] md:text-[3.4vw]"
          wordClassName="mr-[0.2em]"
        />
        <h2 id="vision-heading" className="sr-only">
          Vision is more than what you see
        </h2>

        <div className="mt-16 flex flex-col gap-4 md:mt-24 md:gap-5">
          {LINES.map((line, index) => (
            <TextReveal
              key={line}
              as="p"
              text={line}
              delay={index * 0.06}
              className="font-body text-xl font-light italic text-muted md:text-3xl"
            />
          ))}
        </div>

        <TextReveal
          as="p"
          text="Optimum Optic"
          delay={0.2}
          className="font-display mt-20 text-sm font-medium uppercase tracking-widest3 text-secondary md:mt-28"
        />
      </div>
    </section>
  );
}
