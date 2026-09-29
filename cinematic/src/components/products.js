const RING_SVG = `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#1a1613" stroke-width="6"><circle cx="75" cy="70" r="52"/><circle cx="122" cy="70" r="52"/></g></svg>`;

/** Placeholder catalog — real photography/copy/prices to follow; the
 * grid markup and card component don't need to change when they do. */
export const PRODUCT_PLACEHOLDERS = [
  { name: "Modèle 01", category: "Optical", price: "Prix à confirmer" },
  { name: "Modèle 02", category: "Sunglasses", price: "Prix à confirmer" },
  { name: "Modèle 03", category: "Premium", price: "Prix à confirmer" },
  { name: "Modèle 04", category: "Signature", price: "Prix à confirmer" },
];

export function renderProductCards(listEl, products = PRODUCT_PLACEHOLDERS) {
  listEl.innerHTML = products
    .map(
      (p) => `
      <li class="product-card">
        <div class="product-card__image">
          ${RING_SVG}
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
