/**
 * Everything here is either confirmed fact or an intentional placeholder.
 * No section of the site should hardcode a date, address, or social link —
 * they all read from here, so filling in a real value later requires no
 * component changes and no redesign.
 */

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  brand: {
    name: "Optimum Optic",
    url: "https://optimumoptic.com",
  },

  /**
   * `date` stays null until an opening date is confirmed. Components that
   * would show a countdown (see components/opening/Countdown.tsx) render
   * nothing until this is set — never a placeholder date.
   */
  opening: {
    date: null as string | null, // ISO "YYYY-MM-DD" once confirmed
    statusLabel: "Opening Soon",
  },

  /**
   * The store's location is confirmed only as "near Rabat" at this stage.
   * Every other field is a deliberate null placeholder for when the exact
   * address, coordinates, and hours are confirmed.
   */
  location: {
    area: "Near Rabat, Morocco",
    areaFr: "Près de Rabat, Maroc",
    address: null as string | null,
    mapUrl: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
    phone: null as string | null,
    openingHours: null as string[] | null,
  },

  /** Only the accounts that actually exist should ever appear here. */
  social: {
    instagram: null as string | null,
    facebook: null as string | null,
    whatsapp: null as string | null,
    email: null as string | null,
  },

  nav: [
    { label: "Vision", href: "#vision" },
    { label: "Space", href: "#space" },
    { label: "Collection", href: "#collection" },
    { label: "Opening", href: "#opening" },
    { label: "Location", href: "#location" },
    { label: "Contact", href: "#early-access" },
  ],

  seo: {
    title: "Optimum Optic | Premium Optical Store Near Rabat",
    description:
      "Optimum Optic is a new premium optical store opening near Rabat, Morocco — eyewear, sunglasses and vision care built around precision and design. Opening soon.",
    keywords: [
      "optical store near Rabat",
      "optician near Rabat",
      "eyewear near Rabat",
      "glasses near Rabat",
      "sunglasses near Rabat",
      "optical shop Morocco",
      "premium eyewear Morocco",
      "opticien Rabat",
      "lunettes Rabat",
      "lunettes de soleil Rabat",
      "lentilles de contact Rabat",
    ],
  },
} as const;
