/**
 * Real product photography supplied by Optimum Optic. Use only for models
 * the store actually carries and has the rights to photograph/display —
 * see cinematic/README.md. Entries with no visible brand mark in their
 * photo are labeled by frame style rather than a guessed brand name.
 */
export const PRODUCT_PLACEHOLDERS = [
  {
    name: "Miu Miu",
    category: "Sunglasses",
    description: "Sculptural oval frame in gold-tone metal with a soft rose tint.",
    image: "miu-miu.webp",
  },
  {
    name: "David Beckham",
    category: "Sunglasses",
    description: "Rimless rectangle in gold-tone metal with tortoiseshell temples.",
    image: "david-beckham-rimless-tortoise.webp",
  },
  {
    name: "David Beckham",
    category: "Sunglasses",
    description: "Rimless square frame in brushed titanium with sculpted temple tips.",
    image: "david-beckham-rimless-titanium.webp",
  },
  {
    name: "Dior",
    category: "Sunglasses",
    description: "Bold acetate rectangle in glossy black with the signature 'C Dior' hardware.",
    image: "dior.webp",
  },
  {
    name: "Ray-Ban",
    category: "Sunglasses",
    description: "The classic Aviator in gold-tone metal with gradient brown lenses.",
    image: "rayban-aviator.webp",
  },
  {
    name: "Ray-Ban",
    category: "Sunglasses",
    description: "The Clubmaster in tortoiseshell acetate with gold-tone trim and green lenses.",
    image: "rayban-clubmaster.webp",
  },
  {
    name: "Ray-Ban",
    category: "Sunglasses",
    description: "Oval frame in tortoiseshell acetate with classic rivet detailing.",
    image: "rayban-oval.webp",
  },
  {
    name: "Rimless Titanium",
    category: "Optical",
    description: "Ultra-thin navy titanium frame with a rimless lower edge.",
    image: "optical-rimless-navy.webp",
  },
  {
    name: "Round Frame",
    category: "Optical",
    description: "Matte black round frame with a slim gold-tone temple accent.",
    image: "optical-round-black.webp",
  },
  {
    name: "Cat-Eye Acetate",
    category: "Optical",
    description: "Translucent champagne acetate in a soft cat-eye silhouette.",
    image: "optical-cateye-champagne.webp",
  },
  {
    name: "Wood-Grain Round",
    category: "Optical",
    description: "Round frame with a rich wood-grain finish and a slim gunmetal temple.",
    image: "optical-wood-round.webp",
  },
  {
    name: "Montblanc",
    category: "Optical",
    description: "Rectangular half-rim frame in gold-tone metal with black acetate temple tips.",
    image: "montblanc-rectangle-gold.webp",
  },
  {
    name: "Montblanc",
    category: "Optical",
    description: "Rimless rectangle in polished silver-tone metal with black temple tips.",
    image: "montblanc-rimless-silver.webp",
  },
  {
    name: "Montblanc",
    category: "Sunglasses",
    description: "Rimless square sunglasses in silver-tone metal with deep blue lenses.",
    image: "montblanc-rimless-blue-sun.webp",
  },
];

export function renderProductCards(listEl, products = PRODUCT_PLACEHOLDERS) {
  const base = import.meta.env.BASE_URL;
  listEl.innerHTML = products
    .map(
      (p) => `
      <li class="product-card">
        <div class="product-card__image">
          <img src="${base}products/${p.image}" alt="${p.name} — ${p.description}" loading="lazy" />
          <span class="product-card__discover">Discover</span>
        </div>
        <div class="product-card__meta">
          <p class="product-card__category">${p.category}</p>
          <p class="product-card__name">${p.name}</p>
        </div>
        <p class="product-card__description">${p.description}</p>
      </li>`
    )
    .join("");
}
