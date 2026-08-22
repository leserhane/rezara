import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/lib/config/site";

export function Location() {
  const { location } = siteConfig;

  return (
    <section
      id="location"
      aria-labelledby="location-heading"
      className="relative px-6 py-20 sm:py-28 text-center md:px-12 md:py-48"
    >
      <Reveal className="mx-auto max-w-2xl">
        <span className="font-display text-xs uppercase tracking-widest2 text-muted">05 — Location</span>
        <h2
          id="location-heading"
          className="font-display mt-6 text-[10vw] font-medium uppercase leading-[1.02] tracking-tight text-secondary-light sm:text-[7vw] md:text-[3.6vw]"
        >
          {location.area}
        </h2>

        <address className="font-body mt-6 max-w-md not-italic text-base font-light text-muted mx-auto md:text-lg">
          {location.address ?? location.areaFr}
          {location.phone ? (
            <>
              <br />
              <a href={`tel:${location.phone}`} className="hover:text-secondary-light">
                {location.phone}
              </a>
            </>
          ) : null}
        </address>

        {location.openingHours ? (
          <ul className="font-body mt-6 flex flex-col gap-1 text-sm font-light text-muted">
            {location.openingHours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        {location.mapUrl ? (
          <a
            href={location.mapUrl}
            className="font-display mt-8 inline-block text-xs uppercase tracking-widest2 text-secondary transition-colors hover:text-secondary-light"
            data-cursor="link"
          >
            View on the map →
          </a>
        ) : (
          <p className="font-body mt-8 text-sm font-light italic text-muted">
            Exact address to be announced.
          </p>
        )}
      </Reveal>
    </section>
  );
}
