// Studio Event — static site generator. No dependencies: `node build.mjs`.
// Writes every page, sitemap.xml and robots.txt into ./public (the deployable folder).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "./site.config.mjs";
import { zones, catalog, packs, events, cities, services, homeFaq } from "./content.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "public");
const today = new Date().toISOString().slice(0, 10);
// Path the site is served under ("/" on its own domain, "/se/" on optimumoptic.com).
const base = new URL(site.url + "/").pathname;

// ------------------------------------------------------------------ helpers
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (path) => `${site.url}/${path}`;
const cityPath = (c) => `location-sono-${c.slug}/`;
const waLink = (text) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

const icon = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H10l-4.5 3.5V16H4z"/><path d="M8 9.5h8M8 12.5h5" stroke-linecap="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l1.5 4.5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5L20 15v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
};

const scanLines = '<div class="scan-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';

// ------------------------------------------------------------------ structured data
const businessId = `${site.url}/#business`;
function businessSchema() {
  const address = {
    "@type": "PostalAddress",
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  };
  if (site.address.street) address.streetAddress = site.address.street;
  return {
    "@type": "LocalBusiness",
    "@id": businessId,
    name: site.name,
    description: "Location de platines et tables de mixage Pioneer DJ, sonorisation et jeux de lumière à Rabat, Témara, Skhirat et Salé. Livraison, installation et technicien.",
    url: `${site.url}/`,
    logo: abs("assets/logos/app-icon.png"),
    image: abs("assets/og-image.png"),
    telephone: site.phoneHref,
    email: site.email,
    priceRange: "$$",
    address,
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHours: site.openingHours,
    areaServed: zones.map((z) => ({ "@type": "City", name: z })),
    sameAs: [site.instagram],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Location de matériel événementiel",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title.split(" — ")[0], url: abs(s.slug + "/") },
      })),
    },
  };
}
const faqSchema = (faq) => ({
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});
const breadcrumbSchema = (crumbs) => ({
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

// ------------------------------------------------------------------ layout
const navItems = [
  ...services.map((s) => [s.nav, `${s.slug}/`]),
  ["Packs", "#packs"],
  ["Zones", "#zones"],
  ["Contact", "contact/"],
];

function layout({ path, title, description, body, schema = [], ogTitle }) {
  const depth = path ? path.split("/").filter(Boolean).length : 0;
  const r = depth ? "../".repeat(depth) : "./";
  const link = (p) => (p.startsWith("#") ? `${r}${p}` : `${r}${p}`);
  const nav = navItems
    .map(([label, p]) => `<a href="${link(p)}"${p === path ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  const graph = { "@context": "https://schema.org", "@graph": [businessSchema(), ...schema] };
  const fullTitle = path ? `${title} | ${site.name}` : title;
  const html = `<!doctype html>
<html lang="fr-MA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0b0c0f">
<meta name="geo.region" content="MA-RAB">
<meta name="geo.placename" content="Rabat">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_MA">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${esc(ogTitle || fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs("assets/og-image.png")}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${r}assets/logos/app-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${r}assets/logos/app-icon.png">
<link rel="manifest" href="${r}site.webmanifest">
<link rel="preload" href="${r}assets/fonts/ArchivoExpanded-ExtraBold.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${r}assets/fonts/Archivo-Regular.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="${r}assets/styles.css">
<script type="application/ld+json">${JSON.stringify(graph)}</script>
</head>
<body>
<a class="skip" href="#main">Aller au contenu</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${r}" aria-label="${site.name} — accueil"><img src="${r}assets/logos/logo-horizontal-night.svg" alt="${site.name}" width="180" height="22"></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${icon.menu}</button>
    <nav class="nav" id="nav" aria-label="Navigation principale">${nav}<a class="btn btn-primary" href="${r}contact/">Devis gratuit</a></nav>
    <a class="btn btn-primary header-cta" href="${r}contact/">Devis gratuit</a>
  </div>
</header>
<main id="main">
${body(r, link)}
</main>
${footer(r)}
<a class="wa-float" href="${waLink("Bonjour Studio Event, je souhaite un devis pour une location.")}" target="_blank" rel="noopener" aria-label="Demander un devis sur WhatsApp">${icon.chat}</a>
<script src="${r}assets/app.js" defer></script>
</body>
</html>
`;
  const file = join(OUT, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  pages.push(path);
}
const pages = [];

function footer(r) {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <img src="${r}assets/logos/logo-horizontal-night.svg" alt="${site.name}" width="200" height="24" loading="lazy">
        <p class="muted" style="margin:24px 0 0;max-width:340px">Location de platines Pioneer DJ, sonorisation et jeux de lumière. Livraison, installation et technicien à Rabat, Témara, Skhirat et Salé.</p>
      </div>
      <div>
        <h2>Location</h2>
        <ul>${services.map((s) => `<li><a href="${r}${s.slug}/">${s.short}</a></li>`).join("")}<li><a href="${r}#packs">Packs événement</a></li></ul>
      </div>
      <div>
        <h2>Zones</h2>
        <ul>${cities.map((c) => `<li><a href="${r}${cityPath(c)}">Location sono ${c.name}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="tel:${site.phoneHref}" class="spec">${site.phone}</a></li>
          <li><a href="${waLink("Bonjour Studio Event, je souhaite un devis.")}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="mailto:${site.email}">${site.email}</a></li>
          <li><a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a></li>
          <li class="muted spec">${site.hours}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom small">
      <span>© ${new Date().getFullYear()} ${site.name} · ${site.address.city}, Maroc</span>
      <span>Pioneer DJ est une marque de son propriétaire ; Studio Event en loue le matériel.</span>
    </div>
  </div>
</footer>`;
}

// ------------------------------------------------------------------ blocks
const eyebrowClass = (cat) => (cat === "lumiere" ? "eyebrow cool" : "eyebrow");

function packCard(p, r, primary) {
  return `<article class="card">
  <p class="${eyebrowClass(p.cat)}">${p.eyebrow}</p>
  <h3>${p.name}</h3>
  <ul class="specs">${p.specs.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join("")}</ul>
  <div class="foot"><span class="small muted">${p.note}</span><a class="btn ${primary ? "btn-primary" : "btn-secondary"}" href="${r}contact/?pack=${encodeURIComponent(p.name)}">Devis</a></div>
</article>`;
}

function packsSection(r, list = packs, head = true) {
  return `<section class="section" id="packs" aria-labelledby="packs-title">
  <div class="wrap">
    ${head ? `<div class="section-head"><p class="eyebrow">Packs événement</p><h2 class="display-l" id="packs-title">Des packs prêts à jouer</h2><p>Composés pour les demandes les plus fréquentes, ajustables à votre salle. Le prix dépend de la date, du lieu et de la durée : devis gratuit sous 24 h.</p></div>` : `<h2 class="sr-only" id="packs-title">Packs</h2>`}
    <div class="grid grid-3">${list.map((p, i) => packCard(p, r, i === 0)).join("")}</div>
  </div>
</section>`;
}

function faqSection(faq, title = "Questions fréquentes") {
  return `<section class="section" aria-labelledby="faq-title">
  <div class="wrap split">
    <div class="section-head" style="margin:0"><p class="eyebrow">FAQ</p><h2 class="display-l" id="faq-title">${title}</h2><p>Une autre question ? Écrivez-nous sur WhatsApp, un technicien vous répond.</p></div>
    <div class="faq">${faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><div class="answer"><p>${esc(a)}</p></div></details>`).join("")}</div>
  </div>
</section>`;
}

function ctaBand(r, title = "Votre soirée, notre matériel", text = "Date, ville, nombre d'invités : c'est tout ce qu'il nous faut pour un devis gratuit et détaillé sous 24 h.") {
  return `<section class="scan cta-band" aria-labelledby="cta-title">
  ${scanLines}
  <div class="wrap">
    <div><h2 class="display-l" id="cta-title">${title}</h2><p>${text}</p></div>
    <div class="btn-row"><a class="btn btn-dark" href="${r}contact/">Demander un devis</a><a class="btn btn-outline-dark" href="tel:${site.phoneHref}">${icon.phone}Appeler</a></div>
  </div>
</section>`;
}

function stepsSection() {
  const steps = [
    ["Votre demande", "Date, lieu, nombre d'invités et type d'événement, par WhatsApp, téléphone ou formulaire."],
    ["Devis sous 24 h", "Un devis détaillé : matériel, livraison, installation, technicien. Sans engagement."],
    ["Installation", "Nous livrons, installons et réglons le son et la lumière avant l'arrivée des invités."],
    ["Démontage", "À la fin de l'événement, nous démontons et reprenons le matériel. Vous n'avez rien à gérer."],
  ];
  return `<section class="section" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Comment ça marche</p><h2 class="display-l" id="steps-title">Du devis au démontage</h2></div>
    <ol class="steps">${steps.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
  </div>
</section>`;
}

function zonesSection(r, current) {
  const list = cities.filter((c) => c.slug !== current);
  return `<section class="section" id="zones" aria-labelledby="zones-title">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Zones d'intervention</p><h2 class="display-l" id="zones-title">${current ? "Nous intervenons aussi à" : "Rabat · Témara · Skhirat · Salé"}</h2>${current ? "" : "<p>Livraison, installation et reprise du matériel dans les quatre villes, depuis notre dépôt de Rabat. Kénitra, Bouznika et Mohammedia sur demande.</p>"}</div>
    <div class="grid grid-${list.length === 4 ? 4 : 3}">${list
      .map(
        (c) => `<a class="card zone" href="${r}${cityPath(c)}">
      <p class="code-id muted">${c.areas.slice(0, 3).join(" · ")}</p>
      <div><h3 class="headline">${c.name}</h3><p class="small muted" style="margin-top:8px">Sono, lumière & Pioneer DJ</p></div>
      <span class="arrow">Voir la zone →</span>
    </a>`
      )
      .join("")}</div>
  </div>
</section>`;
}

function catalogTable(key, caption) {
  return `<table class="catalog">
  <caption class="eyebrow muted">${caption}</caption>
  <thead><tr><th scope="col">Réf.</th><th scope="col">Matériel</th><th scope="col">Caractéristiques</th></tr></thead>
  <tbody>${catalog[key].map(([id, name, spec]) => `<tr><td class="code-id muted">${id}</td><td class="name">${name}</td><td class="spec">${spec}</td></tr>`).join("")}</tbody>
</table>`;
}

function pageHero({ crumbs, eyebrow, eyebrowCls = "eyebrow", h1, lead, r, extra = "" }) {
  return `<section class="hero page-hero">
  <div class="hero-mark" aria-hidden="true"><img src="${r}assets/logos/mark-night.svg" alt="" width="820" height="393"></div>
  <div class="wrap">
    <ol class="crumbs">${crumbs.map(([n, p], i) => (i < crumbs.length - 1 ? `<li><a href="${r}${p}">${n}</a></li>` : `<li aria-current="page">${n}</li>`)).join("")}</ol>
    <div class="hero-copy">
      <p class="${eyebrowCls}">${eyebrow}</p>
      <h1 class="display-xl">${h1.join("<br>")}</h1>
      <p class="lead">${lead}</p>
      <div class="btn-row"><a class="btn btn-primary" href="${r}contact/">Demander un devis</a><a class="btn btn-secondary" href="${waLink("Bonjour Studio Event, je souhaite un devis.")}" target="_blank" rel="noopener">${icon.chat}WhatsApp</a></div>
      ${extra}
    </div>
  </div>
</section>`;
}

// ------------------------------------------------------------------ pages
// Home
layout({
  path: "",
  title: "Location Pioneer DJ, Sono & Lumière à Rabat, Témara, Skhirat, Salé | Studio Event",
  ogTitle: "Studio Event — Location Pioneer DJ, sono & lumière à Rabat",
  description: "Location de tables de mixage Pioneer DJ (CDJ-3000, DJM-A9), sonorisation et jeux de lumière à Rabat, Témara, Skhirat et Salé. Livraison, installation, technicien. Devis gratuit sous 24 h.",
  schema: [faqSchema(homeFaq)],
  body: (r) => `<section class="hero">
  <div class="hero-mark" aria-hidden="true"><img src="${r}assets/logos/mark-night.svg" alt="" width="820" height="393" fetchpriority="high"></div>
  <div class="wrap">
    <div class="hero-copy">
      <p class="eyebrow">Rabat · Témara · Skhirat · Salé</p>
      <h1 class="display-xl">Location<br>Pioneer DJ,<br>sono &amp; lumière</h1>
      <p class="lead">Platines et tables de mixage Pioneer DJ, sonorisation et jeux de lumière pour vos mariages, soirées et événements d'entreprise. Livrés, installés et réglés par nos techniciens.</p>
      <div class="btn-row"><a class="btn btn-primary" href="${r}contact/">Demander un devis</a><a class="btn btn-secondary" href="${waLink("Bonjour Studio Event, je souhaite un devis.")}" target="_blank" rel="noopener">${icon.chat}WhatsApp</a></div>
      <ul class="hero-facts small"><li>Devis gratuit sous 24 h</li><li>Livraison + installation</li><li>Technicien sur place</li></ul>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="services-title">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Son · Lumière · DJ</p><h2 class="display-l" id="services-title">Tout le matériel de votre événement</h2><p>Un seul prestataire pour le son, la lumière et les platines : un seul devis, une seule équipe, une installation cohérente.</p></div>
    <div class="grid grid-3">${services
      .map(
        (s, i) => `<a class="card" href="${r}${s.slug}/">
      <span class="tile-num">0${i + 1}</span>
      <p class="eyebrow ${s.eyebrowClass}">${s.eyebrow}</p>
      <h3 class="headline">${s.short}</h3>
      <p class="muted">${s.cardText}</p>
      <ul class="specs">${catalog[s.key].slice(0, 3).map(([, n]) => `<li><span>${n}</span></li>`).join("")}</ul>
      <span class="btn btn-ghost" style="margin-top:auto">Voir le matériel →</span>
    </a>`
      )
      .join("")}</div>
  </div>
</section>

${packsSection(r)}

<section class="section day" aria-labelledby="events-title">
  <div class="wrap split">
    <div class="section-head" style="margin:0"><p class="eyebrow">Événements</p><h2 class="display-l" id="events-title">Mariages, soirées, entreprises</h2><p>Nous équipons chaque semaine des événements de 20 à 1 000 invités, en salle comme en plein air.</p></div>
    <div class="prose">
      <ul class="tags" style="margin-bottom:32px">${events.map((e) => `<li>${e}</li>`).join("")}</ul>
      <p>Un mariage à Skhirat, une soirée privée dans une villa de Témara, un séminaire à Rabat ou des fiançailles à Salé n'ont pas les mêmes besoins. Nous commençons toujours par la salle, le nombre d'invités et le déroulé de la soirée, puis nous proposons le matériel juste nécessaire.</p>
      <p>Nos techniciens connaissent les lieux de la région, les contraintes d'horaires et d'accès, et restent joignables jusqu'au démontage.</p>
    </div>
  </div>
</section>

${stepsSection()}
${zonesSection(r)}
${faqSection(homeFaq)}
${ctaBand(r)}`,
});

// Services
for (const s of services) {
  const crumbs = [["Accueil", ""], [s.eyebrow, `${s.slug}/`]];
  const related = packs.filter((p) => p.cat === s.key);
  const captions = { dj: "Catalogue Pioneer DJ", sono: "Catalogue sonorisation", lumiere: "Catalogue lumière" };
  layout({
    path: `${s.slug}/`,
    title: s.title,
    description: s.description,
    schema: [
      {
        "@type": "Service",
        name: s.title.split(" — ")[0],
        serviceType: s.eyebrow,
        description: s.description,
        provider: { "@id": businessId },
        areaServed: zones.map((z) => ({ "@type": "City", name: z })),
        url: abs(`${s.slug}/`),
      },
      faqSchema(s.faq),
      breadcrumbSchema(crumbs),
    ],
    body: (r) => `${pageHero({ crumbs, eyebrow: `${s.eyebrow} · Rabat, Témara, Skhirat, Salé`, eyebrowCls: `eyebrow ${s.eyebrowClass}`, h1: s.h1, lead: s.lead, r })}

<section class="section" aria-labelledby="intro-title">
  <div class="wrap split">
    <div class="prose">
      <h2 class="headline" id="intro-title" style="margin-bottom:24px">${s.short} à Rabat et alentours</h2>
      ${s.intro.map((p) => `<p>${p}</p>`).join("")}
    </div>
    <div class="card">
      <p class="eyebrow">Inclus</p>
      <ul class="specs">${s.included.map((i) => `<li><span>${i}</span><span>✓</span></li>`).join("")}</ul>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="catalog-title">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow ${s.eyebrowClass}">Catalogue</p><h2 class="display-l" id="catalog-title">Le matériel</h2><p>Disponibilité selon la date. Toutes les références sont combinables avec la sono, la lumière et les platines.</p></div>
    ${catalogTable(s.key, captions[s.key])}
  </div>
</section>

${related.length ? packsSection(r, related, false).replace('id="packs"', 'id="packs" style="padding-top:0"') : ""}
${faqSection(s.faq, "Vos questions")}
${zonesSection(r)}
${ctaBand(r)}`,
  });
}

// Cities
for (const c of cities) {
  const crumbs = [["Accueil", ""], [`Location sono ${c.name}`, cityPath(c)]];
  layout({
    path: cityPath(c),
    title: c.title,
    description: c.description,
    schema: [
      {
        "@type": "Service",
        name: c.title,
        serviceType: "Location de sonorisation, lumière et matériel DJ",
        provider: { "@id": businessId },
        areaServed: { "@type": "City", name: c.name },
        url: abs(cityPath(c)),
      },
      faqSchema(c.faq),
      breadcrumbSchema(crumbs),
    ],
    body: (r) => `${pageHero({ crumbs, eyebrow: `Zone · ${c.name}`, h1: c.h1, lead: c.lead, r })}

<section class="section" aria-labelledby="intro-title">
  <div class="wrap split">
    <div class="prose">
      <h2 class="headline" id="intro-title" style="margin-bottom:24px">Son, lumière et DJ à ${c.name}</h2>
      ${c.intro.map((p) => `<p>${p}</p>`).join("")}
      <p><strong>Lieux équipés :</strong> ${c.venues}</p>
    </div>
    <div class="card">
      <p class="eyebrow">Quartiers desservis</p>
      <ul class="tags">${c.areas.map((a) => `<li>${a}</li>`).join("")}</ul>
      <p class="small muted">Livraison, installation et reprise incluses sur devis.</p>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="svc-title">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">À ${c.name}</p><h2 class="display-l" id="svc-title">Ce que nous louons</h2></div>
    <div class="grid grid-3">${services
      .map(
        (s) => `<a class="card" href="${r}${s.slug}/">
      <p class="eyebrow ${s.eyebrowClass}">${s.eyebrow} ${c.name}</p>
      <h3 class="headline">${s.short}</h3>
      <p class="muted">${s.cardText}</p>
      <span class="btn btn-ghost" style="margin-top:auto">Voir le matériel →</span>
    </a>`
      )
      .join("")}</div>
  </div>
</section>

${packsSection(r, packs.slice(0, 3))}
${faqSection(c.faq, `Location à ${c.name}`)}
${zonesSection(r, c.slug)}
${ctaBand(r, `Un événement à ${c.name}&nbsp;?`)}`,
  });
}

// Contact / devis
{
  const crumbs = [["Accueil", ""], ["Devis", "contact/"]];
  layout({
    path: "contact/",
    title: "Devis gratuit — Location sono, lumière & Pioneer DJ",
    description: "Demandez un devis gratuit pour la location de sono, jeux de lumière et platines Pioneer DJ à Rabat, Témara, Skhirat et Salé. Réponse sous 24 h par WhatsApp ou téléphone.",
    schema: [breadcrumbSchema(crumbs)],
    body: (r) => `<section class="hero page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="${r}">Accueil</a></li><li aria-current="page">Devis</li></ol>
    <div class="hero-copy"><p class="eyebrow">Devis gratuit sous 24 h</p><h1 class="display-xl">Parlons de<br>votre soirée</h1><p class="lead">Quelques informations suffisent. Le formulaire prépare votre message WhatsApp : vous n'avez qu'à l'envoyer.</p></div>
  </div>
</section>
<section class="section">
  <div class="wrap split">
    <form class="form card" id="quote" data-wa="${site.whatsapp}" data-mail="${site.email}" novalidate>
      <div class="row">
        <div class="field"><label for="f-name">Nom</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="f-phone">Téléphone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
      </div>
      <div class="row">
        <div class="field"><label for="f-date">Date de l'événement</label><input id="f-date" name="date" type="date" required></div>
        <div class="field"><label for="f-city">Ville</label><select id="f-city" name="city" required><option value="">Choisir…</option>${zones.map((z) => `<option>${z}</option>`).join("")}<option>Autre ville</option></select></div>
      </div>
      <div class="row">
        <div class="field"><label for="f-type">Type d'événement</label><select id="f-type" name="type">${["Mariage", "Fiançailles / henné", "Anniversaire", "Soirée privée", "Événement d'entreprise", "Conférence / séminaire", "DJ set / soirée club", "Autre"].map((t) => `<option>${t}</option>`).join("")}</select></div>
        <div class="field"><label for="f-guests">Nombre d'invités</label><input id="f-guests" name="guests" type="number" min="1" inputmode="numeric"></div>
      </div>
      <fieldset class="field"><legend>Matériel souhaité</legend>
        <div class="checks">${["Platines Pioneer DJ", "Sono", "Lumière", "Micros sans fil", "Fumée lourde / étincelles", "Technicien", "DJ"].map((t) => `<label class="check"><input type="checkbox" name="gear" value="${t}"><span>${t}</span></label>`).join("")}</div>
      </fieldset>
      <div class="field"><label for="f-pack">Pack (optionnel)</label><select id="f-pack" name="pack"><option value="">Aucun / je ne sais pas</option>${packs.map((p) => `<option>${p.name}</option>`).join("")}</select></div>
      <div class="field"><label for="f-msg">Précisions</label><textarea id="f-msg" name="message" placeholder="Lieu, horaires, intérieur ou plein air…"></textarea></div>
      <p class="form-error" id="f-error" role="alert" hidden></p>
      <div class="btn-row"><button class="btn btn-primary" type="submit">${icon.chat}Envoyer sur WhatsApp</button><button class="btn btn-secondary" type="button" id="f-mail">Envoyer par e-mail</button></div>
      <p class="form-note small muted">Vos informations servent uniquement à préparer votre devis.</p>
    </form>
    <div>
      <h2 class="headline" style="margin-bottom:24px">Nous joindre</h2>
      <ul class="contact-list">
        <li><span class="k">Téléphone</span><a class="spec" style="font-size:16px" href="tel:${site.phoneHref}">${site.phone}</a></li>
        <li><span class="k">WhatsApp</span><a href="${waLink("Bonjour Studio Event, je souhaite un devis.")}" target="_blank" rel="noopener">Écrire sur WhatsApp →</a></li>
        <li><span class="k">E-mail</span><a href="mailto:${site.email}">${site.email}</a></li>
        <li><span class="k">Instagram</span><a href="${site.instagram}" target="_blank" rel="noopener">@studioevent.ma</a></li>
        <li><span class="k">Horaires</span><span class="spec" style="font-size:16px">${site.hours}</span></li>
        <li><span class="k">Zones</span><span>${zones.join(" · ")}</span></li>
      </ul>
    </div>
  </div>
</section>`,
  });
}

// ------------------------------------------------------------------ 404, sitemap, robots, manifest
{
  const r = base;
  const html = `<!doctype html><html lang="fr-MA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page introuvable | ${site.name}</title><meta name="robots" content="noindex"><link rel="icon" href="${r}assets/logos/app-icon.svg" type="image/svg+xml"><link rel="stylesheet" href="${r}assets/styles.css"></head>
<body><main id="main" class="hero" style="min-height:100vh"><div class="hero-mark" aria-hidden="true"><img src="${r}assets/logos/mark-night.svg" alt=""></div><div class="wrap"><div class="hero-copy"><img src="${r}assets/logos/logo-horizontal-night.svg" alt="${site.name}" width="200" height="24"><p class="eyebrow">Erreur 404</p><h1 class="display-xl">Page<br>introuvable</h1><p class="lead">Cette page n'existe pas ou a été déplacée.</p><div class="btn-row"><a class="btn btn-primary" href="${r}">Retour à l'accueil</a><a class="btn btn-secondary" href="${r}contact/">Demander un devis</a></div></div></div></main></body></html>`;
  writeFileSync(join(OUT, "404.html"), html);
}

const priority = (p) => (p === "" ? "1.0" : p.startsWith("location-sono-") || services.some((s) => p === `${s.slug}/`) ? "0.9" : "0.7");
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${abs(p)}</loc><lastmod>${today}</lastmod><priority>${priority(p)}</priority></url>`).join("\n")}
</urlset>
`
);
// Crawlers only read robots.txt at the domain root; under a sub-path the root one must list our sitemap instead.
if (base === "/") writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
writeFileSync(
  join(OUT, "site.webmanifest"),
  JSON.stringify(
    {
      name: site.name,
      short_name: site.name,
      start_url: "./",
      display: "standalone",
      background_color: "#0b0c0f",
      theme_color: "#0b0c0f",
      icons: [
        { src: "assets/logos/app-icon.png", sizes: "1024x1024", type: "image/png" },
        { src: "assets/logos/app-icon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    },
    null,
    2
  )
);

console.log(`Built ${pages.length} pages into ${OUT}`);
