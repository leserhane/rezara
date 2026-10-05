#!/usr/bin/env python3
"""Publish the TitSuit blog one article per day.

Sources live in _blog-src/ (never deployed, see .assetsignore). The list of
published articles and their dates is kept in _blog-src/published.json.

    python3 _blog-src/publish.py --publish-next   # add today's article, rebuild
    python3 _blog-src/publish.py                  # rebuild only

The build writes blog/, sitemap-blog.xml and llms.txt with published
articles only. Links to articles that are not out yet are shown as plain
text, and dropped from the "À lire aussi" lists, so nothing points to a 404.
"""
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_blog-src"
OUT = ROOT / "blog"
STATE = SRC / "published.json"
SITE = "https://www.titsuit.com"
SOURCE_DATE = "2026-10-05"
SOURCE_DATE_FR = "5 octobre 2026"
MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
          "août", "septembre", "octobre", "novembre", "décembre"]


def fr_date(iso):
    d = dt.date.fromisoformat(iso)
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def load_order():
    lines = (SRC / "order.txt").read_text(encoding="utf-8").splitlines()
    return [l.strip() for l in lines if l.strip() and not l.startswith("#")]


def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return []


def publish_next(state, order, today):
    if any(p["date"] == today for p in state):
        print(f"An article is already published for {today}.")
        return False
    done = {p["slug"] for p in state}
    for slug in order:
        if slug not in done:
            state.append({"slug": slug, "date": today})
            print(f"Publishing {slug} on {today}.")
            return True
    print("Every article is already published.")
    return False


def render_article(slug, date, live):
    html = (SRC / slug / "index.html").read_text(encoding="utf-8")
    html = re.sub(r'("date(?:Published|Modified)":\s*")' + SOURCE_DATE + '"', r"\g<1>" + date + '"', html)
    html = html.replace(SOURCE_DATE_FR, fr_date(date))

    # Drop related-article cards for articles that are not out yet.
    def keep_li(m):
        return m.group(0) if m.group(1) in live else ""
    html = re.sub(r'<li><a href="/blog/([a-z0-9-]+)/">[^<]*</a></li>', keep_li, html)
    html = re.sub(r'<h2 id="a-lire">[^<]*</h2>\s*<ul class="rel">\s*</ul>', "", html)

    # Turn remaining links to unpublished articles into plain text.
    def unlink(m):
        return m.group(0) if m.group(1) in live else m.group(2)
    html = re.sub(r'<a href="/blog/([a-z0-9-]+)/">(.*?)</a>', unlink, html, flags=re.S)
    return html


def render_index(pubs, live):
    html = (SRC / "_index.html").read_text(encoding="utf-8")
    items = {}
    for m in re.finditer(r'<li>\s*<a href="/blog/([a-z0-9-]+)/">.*?</a>\s*</li>', html, re.S):
        items[m.group(1)] = m.group(0)
    ordered = sorted(pubs, key=lambda p: p["date"], reverse=True)
    lis = []
    for p in ordered:
        li = items.get(p["slug"])
        if li:
            lis.append(li.replace(SOURCE_DATE_FR, fr_date(p["date"])))
    return re.sub(r'(<ul class="rel">).*?(</ul>)', lambda m: m.group(1) + "\n".join(lis) + m.group(2), html, count=1, flags=re.S)


def render_sitemap(pubs):
    last = max(p["date"] for p in pubs)
    rows = [f"  <url><loc>{SITE}/blog/</loc><lastmod>{last}</lastmod></url>"]
    rows += [f"  <url><loc>{SITE}/blog/{p['slug']}/</loc><lastmod>{p['date']}</lastmod></url>" for p in pubs]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n")


def render_llms(pubs):
    text = (SRC / "_llms.txt").read_text(encoding="utf-8")
    lines = text.splitlines()
    out, by_slug = [], {}
    for l in lines:
        m = re.match(r"- \[.*?\]\(" + re.escape(SITE) + r"/blog/([a-z0-9-]+)/\)", l)
        if m:
            by_slug[m.group(1)] = l
    inserted = False
    for l in lines:
        if re.match(r"- \[.*?\]\(" + re.escape(SITE) + r"/blog/", l):
            if not inserted:
                out += [by_slug[p["slug"]] for p in pubs if p["slug"] in by_slug]
                inserted = True
            continue
        out.append(l)
    return "\n".join(out) + "\n"


def build(state):
    if not state:
        print("Nothing published yet.")
        return
    live = {p["slug"] for p in state}
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for p in state:
        (OUT / p["slug"]).mkdir()
        (OUT / p["slug"] / "index.html").write_text(render_article(p["slug"], p["date"], live), encoding="utf-8")
    (OUT / "index.html").write_text(render_index(state, live), encoding="utf-8")
    (ROOT / "sitemap-blog.xml").write_text(render_sitemap(state), encoding="utf-8")
    (ROOT / "llms.txt").write_text(render_llms(state), encoding="utf-8")
    print(f"Built {len(state)} article(s).")


def main():
    order = load_order()
    state = load_state()
    if "--publish-next" in sys.argv:
        today = dt.datetime.now(ZoneInfo("Africa/Casablanca")).date().isoformat()
        if publish_next(state, order, today):
            STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    build(state)


if __name__ == "__main__":
    main()
