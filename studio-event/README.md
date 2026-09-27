# Studio Event — site vitrine

Site de Studio Event : location de platines et tables de mixage **Pioneer DJ**, **sonorisation** et **jeux de lumière** à **Rabat, Témara, Skhirat et Salé**. Construit sur l'identité visuelle Studio Event (monogramme SE à lignes de balayage, Night / amber `#ffb000`, Archivo Expanded, JetBrains Mono).

Site statique, sans framework ni dépendance : rapide à charger, ce que Google récompense.

## Structure

| Chemin | Rôle |
| --- | --- |
| `site.config.mjs` | Coordonnées (téléphone, WhatsApp, e-mail, adresse, domaine). **À compléter avant la mise en ligne.** |
| `content.mjs` | Catalogue, packs, villes, FAQ : tout le texte du site. |
| `build.mjs` | Générateur : `node build.mjs` réécrit les pages dans `public/`. |
| `public/` | Le site à déployer (HTML, `assets/`, `sitemap.xml`, `robots.txt`, `404.html`). |

Pages générées : accueil, `location-pioneer-dj/`, `location-sono/`, `location-lumiere/`, une page par ville (`location-sono-rabat/`, `-temara/`, `-skhirat/`, `-sale/`) et `contact/` (formulaire de devis qui prépare un message WhatsApp ou un e-mail, sans serveur).

## Référencement (SEO) intégré

- Une page ciblée par recherche : « location Pioneer DJ Rabat », « location sono Témara », « location lumière Skhirat », etc., avec titre, description et H1 uniques.
- Données structurées schema.org : `LocalBusiness` (zones desservies, horaires, catalogue), `Service`, `FAQPage`, `BreadcrumbList`.
- URL canoniques, Open Graph (`assets/og-image.png`), `sitemap.xml`, `robots.txt`, balises géographiques, `lang="fr-MA"`.
- Maillage interne entre services et villes, polices auto-hébergées, aucune ressource externe.

## Avant la mise en ligne

1. Renseigner les vraies coordonnées dans `site.config.mjs` (le numéro actuel est un exemple), puis `node build.mjs`.
2. Relire les textes de `content.mjs` (catalogue réellement disponible, conditions de caution, zones).
3. Déployer `public/` à la racine du domaine (GitHub Pages, Netlify, Cloudflare Pages…). Les liens sont relatifs, mais `404.html` et le manifeste supposent la racine.
4. Créer la **fiche Google Business Profile** avec exactement le même nom, téléphone et adresse, et la lier au site : c'est le premier levier pour apparaître en tête dans Google Maps à Rabat.
5. Déclarer le site dans **Google Search Console** et y soumettre `sitemap.xml`.
6. Ajouter de vraies photos d'événements (brand book : basse lumière, une source forte, jamais de stock) : elles améliorent la conversion et le référencement image.
