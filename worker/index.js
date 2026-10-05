// Worker for www.titsuit.com.
// Every path is served straight from the static assets except /hiddenmuseum/,
// which is password protected on the server: nothing under that path (pages,
// images, the guided-tour API) leaves Cloudflare until the visitor signs in.
//
// The password is NOT stored in this repository. It is read from the Worker
// secret MUSEUM_PASSWORD (Cloudflare dashboard → Workers → titsuit → Settings
// → Variables and Secrets). If the secret is missing, the area stays locked.
import { DurableObject } from 'cloudflare:workers';

const AREA = '/hiddenmuseum';
const LOGIN = `${AREA}/__login`;
const LOGOUT = `${AREA}/__logout`;
const COOKIE = 'hm_session';
const SESSION_SECONDS = 12 * 60 * 60;

const API = '/hiddenmuseum/api/tours';
const CAPACITY = 2; // guided tours that can run at the same time (two guides)
const GROUP_MIN = 3;
// Entry times per opening day, mirrored from hiddenmuseum/app.js.
const SLOTS = {
  week: ['09:00', '11:00', '13:00', '15:00', '16:30'],
  sat: ['09:00', '10:30', '15:00', '16:30'],
  sun: ['09:00', '10:30', '12:00']
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }
});

// "20261003" -> Date (UTC midnight) when it is a valid, bookable opening day.
function parseDay(s) {
  if (!/^\d{8}$/.test(s || '')) return null;
  const d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
  if (d.toISOString().slice(0, 10).replace(/-/g, '') !== s) return null;
  if (d.getUTCDay() === 1) return null; // closed on Mondays
  const now = Date.now(), DAY = 864e5;
  if (d.getTime() < now - 2 * DAY || d.getTime() > now + 93 * DAY) return null;
  return d;
}
const slotsFor = (d) => SLOTS[d.getUTCDay() === 6 ? 'sat' : d.getUTCDay() === 0 ? 'sun' : 'week'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path !== AREA && !path.startsWith(AREA + '/')) return env.ASSETS.fetch(request);
    if (path === AREA) return Response.redirect(`${url.origin}${AREA}/${url.search}`, 301);

    const lang = pickLang(request);
    const secret = env.MUSEUM_PASSWORD;
    if (!secret) return page(503, lang, 'closed', false);

    if (path === LOGOUT) {
      return new Response(null, {
        status: 303,
        headers: { Location: `${AREA}/`, 'Set-Cookie': cookie('', 0), ...privateHeaders() },
      });
    }

    if (path === LOGIN) {
      if (request.method !== 'POST') return Response.redirect(`${url.origin}${AREA}/`, 303);
      const form = await request.formData().catch(() => null);
      const attempt = form ? String(form.get('password') || '') : '';
      if (await safeEqual(attempt, secret)) {
        const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
        const token = `${exp}.${await sign(String(exp), secret)}`;
        return new Response(null, {
          status: 303,
          headers: { Location: `${AREA}/`, 'Set-Cookie': cookie(token, SESSION_SECONDS), ...privateHeaders() },
        });
      }
      // Slow down guessing a little; waiting costs no CPU time.
      await new Promise((r) => setTimeout(r, 800));
      return page(401, lang, 'wrong', true);
    }

    if (!(await validSession(request, secret))) {
      const wantsHtml = (request.headers.get('Accept') || '').includes('text/html');
      return wantsHtml ? page(401, lang, '', true) : new Response('Unauthorized', { status: 401, headers: privateHeaders() });
    }

    if (path === API) {
      if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method' }, 405);
      // One object holds every booking, so check-and-reserve is atomic.
      return env.TOURS.get(env.TOURS.idFromName('rabat')).fetch(request);
    }

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(privateHeaders())) out.headers.set(k, v);
    return out;
  }
};

function privateHeaders() {
  return {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
  };
}

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=${AREA}/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

const enc = new TextEncoder();

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode('hiddenmuseum:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(message, secret) {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison: hash both sides so lengths match, then XOR.
async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function validSession(request, secret) {
  const raw = request.headers.get('Cookie') || '';
  const match = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!match) return false;
  const [exp, sig] = match.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(exp, secret));
}

const TEXT = {
  fr: { eyebrow: 'Accès privé', lead: 'Cet espace est privé. Saisissez le mot de passe pour continuer.', label: 'Mot de passe', enter: 'Entrer', wrong: 'Mot de passe incorrect. Veuillez réessayer.', closed: 'Cet espace est momentanément fermé.' },
  en: { eyebrow: 'Private access', lead: 'This space is private. Enter the password to continue.', label: 'Password', enter: 'Enter', wrong: 'Incorrect password. Please try again.', closed: 'This space is temporarily closed.' },
  ar: { eyebrow: 'ولوج خاص', lead: 'هذا الفضاء خاص. أدخلوا كلمة المرور للمتابعة.', label: 'كلمة المرور', enter: 'دخول', wrong: 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.', closed: 'هذا الفضاء مغلق مؤقتاً.' },
  es: { eyebrow: 'Acceso privado', lead: 'Este espacio es privado. Introduzca la contraseña para continuar.', label: 'Contraseña', enter: 'Entrar', wrong: 'Contraseña incorrecta. Inténtelo de nuevo.', closed: 'Este espacio está cerrado temporalmente.' }
};

// ?lang= first, then the browser's preferred language (as on the museum page), French by default.
function pickLang(request) {
  const q = new URL(request.url).searchParams.get('lang');
  if (TEXT[q]) return q;
  for (const part of (request.headers.get('Accept-Language') || '').split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (TEXT[code]) return code;
  }
  return 'fr';
}

function page(status, lang, messageKey, showForm) {
  const T = TEXT[lang] || TEXT.fr;
  const message = messageKey ? T[messageKey] : '';
  const html = `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${T.eyebrow} · Musées de Bank Al-Maghrib</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23d8b56a' d='M50 3Q68 32 97 50Q68 68 50 97Q32 68 3 50Q32 32 50 3Z'/%3E%3C/svg%3E">
<style>
  :root { --bg:#0b0a09; --ink:#f2ede4; --muted:#a8a197; --accent:#d8b56a; --line:rgba(242,237,228,.28); color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; min-height:100svh; display:grid; place-items:center; padding:24px 16px;
    background: radial-gradient(80% 60% at 50% 35%, #1d1915 0%, var(--bg) 70%); color:var(--ink);
    font: 16px/1.6 "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Naskh Arabic", sans-serif; }
  main { width:100%; max-width:400px; text-align:center; }
  svg { width:96px; height:56px; margin:0 auto 28px; display:block; }
  .eyebrow { font-size:.72rem; letter-spacing:.22em; text-transform:uppercase; color:var(--accent); font-weight:600; margin:0; }
  h1 { font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif; font-weight:300; font-size:2.6rem; line-height:1.05; margin:.3em 0 .4em; }
  p.lead { color:var(--muted); margin:0 0 28px; }
  form { display:grid; gap:12px; text-align:start; }
  label { font-size:.75rem; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); }
  input { min-height:52px; padding:0 18px; border-radius:999px; border:1px solid var(--line); background:transparent; color:var(--ink); font:inherit; }
  input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
  button { min-height:52px; border:0; border-radius:999px; background:var(--accent); color:var(--bg); font:inherit; font-weight:600; cursor:pointer; }
  button:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
  .msg { color:#f4a193; font-size:.92rem; min-height:1.4em; margin:0; }
  [dir="rtl"] .eyebrow, [dir="rtl"] label { letter-spacing:0; }
</style>
</head>
<body>
<main>
  <svg viewBox="0 0 170 100" aria-hidden="true">
    <path fill="#4a2a5c" d="M118 3Q136 32 165 50Q136 68 118 97Q100 68 71 50Q100 32 118 3Z"/>
    <path fill="#8a5d80" d="M84 3Q102 32 131 50Q102 68 84 97Q66 68 37 50Q66 32 84 3Z"/>
    <path fill="#c9ad6e" d="M50 3Q68 32 97 50Q68 68 50 97Q32 68 3 50Q32 32 50 3Z"/>
  </svg>
  <p class="eyebrow">${T.eyebrow}</p>
  <h1 lang="fr" dir="ltr">Musées de Bank Al-Maghrib</h1>
  ${showForm ? `<p class="lead">${T.lead}</p>
  <form method="post" action="${LOGIN}">
    <label for="pw">${T.label}</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus aria-describedby="msg">
    <p class="msg" id="msg" role="alert">${message}</p>
    <button type="submit">${T.enter}</button>
  </form>` : `<p class="lead">${message}</p>`}
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...privateHeaders() },
  });
}

export class Tours extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS tours (
      ref TEXT PRIMARY KEY, day TEXT NOT NULL, slot TEXT NOT NULL, people INTEGER NOT NULL, created INTEGER NOT NULL)`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS tours_day ON tours (day, slot)');
  }

  taken(day) {
    const out = {};
    for (const r of this.sql.exec('SELECT slot, COUNT(*) AS n FROM tours WHERE day = ? GROUP BY slot', day)) out[r.slot] = r.n;
    return out;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const day = url.searchParams.get('date');
      if (!parseDay(day)) return json({ error: 'date' }, 400);
      return json({ date: day, capacity: CAPACITY, taken: this.taken(day) });
    }
    let body;
    try { body = await request.json(); } catch { return json({ error: 'body' }, 400); }
    const { date: day, slot, ref } = body || {};
    const people = Number(body && body.people);
    const d = parseDay(day);
    if (!d) return json({ error: 'date' }, 400);
    if (!slotsFor(d).includes(slot)) return json({ error: 'slot' }, 400);
    if (!/^BAM-[A-Z0-9]{5}$/.test(ref || '')) return json({ error: 'ref' }, 400);
    if (!Number.isInteger(people) || people < GROUP_MIN || people > 60) return json({ error: 'people' }, 400);
    // No await between the check and the insert: the object handles one request at a time here.
    if (this.sql.exec('SELECT 1 FROM tours WHERE ref = ?', ref).toArray().length) return json({ ok: true, taken: this.taken(day) });
    const n = this.taken(day)[slot] || 0;
    if (n >= CAPACITY) return json({ ok: false, reason: 'full', capacity: CAPACITY, taken: this.taken(day) }, 409);
    this.sql.exec('INSERT INTO tours (ref, day, slot, people, created) VALUES (?, ?, ?, ?, ?)', ref, day, slot, people, Date.now());
    return json({ ok: true, capacity: CAPACITY, taken: this.taken(day) });
  }
}
