# TitSuit — www.titsuit.com

Site vitrine de TitSuit (Studio, AI, Digital, Events). Cette branche contient uniquement le site, à la racine, déployé par Cloudflare Pages sur `www.titsuit.com`.

- `index.html` : page unique (CSS et JS intégrés)
- `og.png`, `favicon.svg` : image de partage et icône
- `robots.txt`, `sitemap.xml`, `404.html`

## Déploiement

Cloudflare Workers (projet `titsuit`) publie cette branche à chaque push : branche de production `titsuit-www`, aucune commande de build, commande de déploiement `npx wrangler deploy` (voir `wrangler.jsonc`).

## `/rezaraapp` (redirection)

`www.titsuit.com/rezaraapp/…` redirige (302, côté Worker) vers l'application Rezara hébergée sur Replit, `https://rezara--succesmktgcom.replit.app/…`, en conservant le chemin (les liens de paiement `/rezaraapp/r/<id>` fonctionnent). L'application a besoin de son API Node et de sa base de données, elle ne peut donc pas être servie depuis ce site statique. Adresse de destination : `REZARA_APP` dans `worker/index.js`.

## `/hiddenmuseum` (espace privé)

`hiddenmuseum/` contient le site des Musées de Bank Al-Maghrib, servi sur `www.titsuit.com/hiddenmuseum/` et **protégé par mot de passe** côté serveur : le Worker `worker/index.js` (`run_worker_first` pour `/hiddenmuseum` dans `wrangler.jsonc`) n'envoie aucun fichier de ce dossier, ni l'API des visites guidées, sans session valide. Le reste de titsuit.com n'est pas concerné.

- Le mot de passe **n'est pas dans le dépôt**. Il est lu dans le secret Cloudflare `MUSEUM_PASSWORD` (Workers → `titsuit` → Settings → Variables and Secrets → Add → type *Secret*). Sans ce secret, l'espace reste fermé pour tout le monde.
- Après connexion, un cookie signé (HMAC-SHA-256, `HttpOnly`, `Secure`) est valable 12 heures. Changer le mot de passe invalide toutes les sessions.
- La page de connexion suit la langue du navigateur (fr, ar, en, es). Déconnexion : `/hiddenmuseum/__logout`.

### Langues

Le site du musée est disponible en français, arabe (de droite à gauche), anglais et espagnol. La langue est choisie automatiquement selon le navigateur du visiteur (français par défaut), ou via le sélecteur à drapeaux de l’en-tête ; le choix est mémorisé, et un lien `?lang=fr|ar|en|es` force une langue.

- Textes de l’interface : `tools/i18n/strings.py`, puis `python3 tools/i18n/build.py` pour régénérer `hiddenmuseum/i18n.js`.
- Contenus de la frise : `hiddenmuseum/collection-data.js`, chaque texte au format `{ fr, ar, en, es }`.
- Agenda culturel : `hiddenmuseum/agenda-data.js` (expositions et temps forts, du plus récent au plus ancien ; le statut « En cours / Terminée » est calculé à partir des dates).
- Visites guidées : au plus deux par créneau. Le Worker `worker/index.js` expose `/hiddenmuseum/api/tours` (GET `?date=AAAAMMJJ` pour les places prises, POST pour réserver) et garde les réservations dans le Durable Object `Tours`. Les créneaux sont définis à la fois dans `worker/index.js` et `hiddenmuseum/app.js`.

