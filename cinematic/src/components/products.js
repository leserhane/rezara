/**
 * Real product photography supplied by Optimum Optic. Use only for models
 * the store actually carries and has the rights to photograph/display —
 * see cinematic/README.md.
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
