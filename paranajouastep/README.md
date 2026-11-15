# ParaNajouaStep – parapharmacie en ligne (Kénitra)

Static online shop in French (`/`) and Arabic (`/ar/`), with local SEO for Kénitra and Rabat.

## Edit content
Everything (prices, sizes, products, address, phone/WhatsApp, delivery fees, hours) is in
`_src/data.py`. Lines marked `TODO` are placeholders. After editing:

    python3 _src/build.py

That rebuilds every page, `sitemap.xml`, `robots.txt` and `assets/js/catalog.js`.
Product photos are cropped from the source photo by `_src/crop.py`. To use a real photo
instead, save it as `assets/img/products/<slug>.webp` (square).

## How ordering works
The cart is stored in the visitor's browser. At checkout, the order (with a reference number,
the products, the delivery fee for the city and the customer's details) opens as a WhatsApp
message to the shop's number. Payment is cash on delivery. There's no server or database.

## Deploy
Upload the folder as-is (without `_src/`, which is optional) to any static host
(Netlify, Cloudflare Pages, GitHub Pages…) at the root of the domain set in `STORE['site_url']`.
Then submit `sitemap.xml` in Google Search Console and create a Google Business Profile
for the Kénitra shop with the same name, address and phone number.
