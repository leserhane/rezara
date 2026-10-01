# TitSuit — www.titsuit.com

Site vitrine de TitSuit (Studio, AI, Digital, Events). Cette branche contient uniquement le site, à la racine, déployé par Cloudflare Pages sur `www.titsuit.com`.

- `index.html` : page unique (CSS et JS intégrés)
- `og.png`, `favicon.svg` : image de partage et icône
- `robots.txt`, `sitemap.xml`, `404.html`

## Déploiement

Cloudflare Workers (projet `titsuit`) publie cette branche à chaque push : branche de production `titsuit-www`, aucune commande de build, commande de déploiement `npx wrangler deploy` (voir `wrangler.jsonc`).

## `/hiddenmuseum`

`hiddenmuseum/` contient une copie du site des Musées de Bank Al-Maghrib, servie publiquement (sans mot de passe) sur `www.titsuit.com/hiddenmuseum/`. La page porte une balise `noindex` pour rester hors des moteurs de recherche.

### Langues

Le site du musée est disponible en français, arabe (de droite à gauche), anglais et espagnol. La langue est choisie automatiquement selon le navigateur du visiteur (français par défaut), ou via le sélecteur à drapeaux de l’en-tête ; le choix est mémorisé, et un lien `?lang=fr|ar|en|es` force une langue.

- Textes de l’interface : `tools/i18n/strings.py`, puis `python3 tools/i18n/build.py` pour régénérer `hiddenmuseum/i18n.js`.
- Contenus de la frise : `hiddenmuseum/collection-data.js`, chaque texte au format `{ fr, ar, en, es }`.

