# TitSuit — www.titsuit.com

Site vitrine de TitSuit (Studio, AI, Digital, Events). Cette branche contient uniquement le site, à la racine, déployé par Cloudflare Pages sur `www.titsuit.com`.

- `index.html` : page unique (CSS et JS intégrés)
- `og.png`, `favicon.svg` : image de partage et icône
- `robots.txt`, `sitemap.xml`, `404.html`

## Déploiement

Cloudflare Workers (projet `titsuit`) publie cette branche à chaque push : branche de production `titsuit-www`, aucune commande de build, commande de déploiement `npx wrangler deploy` (voir `wrangler.jsonc`).

## Espace privé `/hiddenmuseum`

`hiddenmuseum/` contient une copie privée du site des Musées de Bank Al-Maghrib, servie sur `www.titsuit.com/hiddenmuseum/`.

L'accès est protégé côté serveur par le Worker `worker/index.js` (`run_worker_first` dans `wrangler.jsonc`) : aucun fichier de ce dossier n'est envoyé sans session valide. Les autres chemins du site passent directement aux fichiers statiques.

- Le mot de passe **n'est pas dans le dépôt**. Il est lu dans le secret Cloudflare `MUSEUM_PASSWORD` (Workers → `titsuit` → Settings → Variables and Secrets → Add → type *Secret*). Sans ce secret, l'espace reste fermé pour tout le monde.
- Après connexion, un cookie signé (HMAC-SHA-256, `HttpOnly`, `Secure`) est valable 12 heures. Changer le mot de passe invalide toutes les sessions.
- Déconnexion : `/hiddenmuseum/__logout`.
