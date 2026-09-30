# TitSuit — www.titsuit.com

Site vitrine de TitSuit (Studio, AI, Digital, Events). Cette branche contient uniquement le site, à la racine, déployé par Cloudflare Pages sur `www.titsuit.com`.

- `index.html` : page unique (CSS et JS intégrés)
- `og.png`, `favicon.svg` : image de partage et icône
- `robots.txt`, `sitemap.xml`, `404.html`

## Déploiement

Cloudflare Workers (projet `titsuit`) publie cette branche à chaque push : branche de production `titsuit-www`, aucune commande de build, commande de déploiement `npx wrangler deploy` (voir `wrangler.jsonc`).
