// Worker for www.titsuit.com.
// Static files are served straight from the assets; only the museum's
// guided-tour API (/hiddenmuseum/api/*) runs through this script.
import { DurableObject } from 'cloudflare:workers';

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
    if (url.pathname !== API) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method' }, 405);
    // One object holds every booking, so check-and-reserve is atomic.
    return env.TOURS.get(env.TOURS.idFromName('rabat')).fetch(request);
  }
};

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
