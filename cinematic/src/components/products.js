const STROKE = "#241a16";

/** Simple parametric line-art glasses icon (front view) in a handful of
 * silhouettes — an original illustration, not a product photo, used only
 * until real photography for each model is available. */
function lensPath(shape, cx) {
  const y = 50;
  switch (shape) {
    case "round":
      return `<circle cx="${cx}" cy="${y}" r="30" />`;
    case "rectangle":
      return `<rect x="${cx - 32}" y="${y - 22}" width="64" height="44" rx="10" />`;
    case "aviator":
      return `<path d="M ${cx - 30} ${y - 16} Q ${cx - 34} ${y + 6} ${cx - 14} ${y + 24} Q ${cx} ${y + 32} ${cx + 14} ${y + 24} Q ${cx + 34} ${y + 6} ${cx + 30} ${y - 16} Q ${cx} ${y - 30} ${cx - 30} ${y - 16} Z" />`;
    case "cateye":
      return `<path d="M ${cx - 32} ${y - 6} Q ${cx - 34} ${y + 22} ${cx - 6} ${y + 22} Q ${cx + 22} ${y + 20} ${cx + 34} ${y - 14} Q ${cx + 18} ${y - 26} ${cx - 4} ${y - 22} Q ${cx - 26} ${y - 18} ${cx - 32} ${y - 6} Z" />`;
    default:
      return `<circle cx="${cx}" cy="${y}" r="30" />`;
  }
}

function glassesIcon(shape) {
  const leftCx = 66;
  const rightCx = 134;
  return `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="${STROKE}" stroke-width="4.5" stroke-linecap="round">
      <path d="M ${leftCx - 30} 46 L 14 40" />
      <path d="M ${rightCx + 30} 46 L 186 40" />
      <path d="M ${leftCx + 24} 38 Q 100 30 ${rightCx - 24} 38" />
      ${lensPath(shape, leftCx)}
      ${lensPath(shape, rightCx)}
    </g>
  </svg>`;
}

/**
 * Real brands and prices as provided by Optimum Optic — not invented.
 * Icons are original line-art illustrations standing in for real product
 * photography, which will follow once available (see cinematic/README.md
 * for why we don't scrape brand photos from the web).
 */
export const PRODUCT_PLACEHOLDERS = [
  { name: "Montblanc", category: "Optical", price: "3 500 MAD", shape: "rectangle" },
  { name: "David Beckham", category: "Sunglasses", price: "2 800 MAD", shape: "aviator" },
  { name: "Cartier", category: "Signature", price: "12 000 MAD", shape: "round" },
  { name: "Ray-Ban", category: "Sunglasses", price: "1 900 MAD", shape: "aviator" },
  { name: "Miu Miu", category: "Sunglasses", price: "3 500 MAD", shape: "cateye" },
  { name: "Boss", category: "Optical", price: "2 500 MAD", shape: "rectangle" },
  { name: "Guess", category: "Sunglasses", price: "2 900 MAD", shape: "round" },
];

export function renderProductCards(listEl, products = PRODUCT_PLACEHOLDERS) {
  listEl.innerHTML = products
    .map(
      (p) => `
      <li class="product-card">
        <div class="product-card__image">
          ${glassesIcon(p.shape)}
          <span class="product-card__discover">Discover</span>
        </div>
        <div class="product-card__meta">
          <div>
            <p class="product-card__category">${p.category}</p>
            <p class="product-card__name">${p.name}</p>
          </div>
          <span class="product-card__price">${p.price}</span>
        </div>
      </li>`
    )
    .join("");
}
