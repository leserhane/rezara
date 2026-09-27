// Studio Event — business details used on every page and in the structured data
// Google reads. Fill in the real values before going live: a wrong phone number
// or address here costs both calls and search ranking.

export const site = {
  name: "Studio Event",
  // Production domain, no trailing slash. Used for canonical URLs, sitemap, Open Graph.
  url: "https://www.studioevent.ma",
  // TODO: real numbers. `phone` is shown and dialled; `whatsapp` is digits only, country code first.
  phone: "+212 6 00 00 00 00",
  phoneHref: "+212600000000",
  whatsapp: "212600000000",
  email: "contact@studioevent.ma",
  instagram: "https://www.instagram.com/studioevent.ma",
  // TODO: real street address (the depot / showroom). Keep it identical to the Google Business Profile.
  address: {
    street: "",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    postalCode: "10000",
    country: "MA",
  },
  // Approximate centre of Rabat; replace with the depot's coordinates.
  geo: { lat: 34.0209, lng: -6.8416 },
  hours: "Lun–Dim · 9 h – 21 h",
  // schema.org openingHours
  openingHours: ["Mo-Su 09:00-21:00"],
};
