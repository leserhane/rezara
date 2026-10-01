/* Musées de Bank Al-Maghrib — interactions
   Everything degrades gracefully: without JS the page is a readable, linear document. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const osReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 900px)');

  const reduced = () => osReduce.matches || root.classList.contains('reduce-motion');

  // Translations (i18n.js). Falls back to the page's built-in English.
  const I18N = window.BAM_I18N || {
    lang: 'en', t: (k) => k, plural: (k, n) => String(n), locale: () => 'en-GB', onChange() {}, set() {},
    L: (v) => (v && typeof v === 'object' ? (v.en || v.fr || '') : (v || '')),
  };
  const t = (k, vars) => I18N.t(k, vars);
  const L = (v) => I18N.L(v);
  const isRTL = () => root.dir === 'rtl';

  /* ------------------------------------------------------------------
     Smooth scrolling (Lenis, loaded from CDN; optional)
     ------------------------------------------------------------------ */
  let lenis = null;
  function startLenis() {
    if (lenis || reduced() || typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (t) => { if (!lenis) return; lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  function stopLenis() { if (lenis) { lenis.destroy(); lenis = null; } }
  function scrollToEl(el, immediate = false) {
    if (!el) return;
    const offset = -(parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) || 72);
    if (lenis) lenis.scrollTo(el, { offset, immediate, duration: 1.4 });
    else el.scrollIntoView({ behavior: immediate || reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  window.addEventListener('load', startLenis);

  // In-page links: smooth scroll + move focus to the target for keyboard/screen-reader users.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' ) { if (a.hasAttribute('data-social')) e.preventDefault(); return; }
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    closeNav();
    scrollToEl(target);
    history.replaceState(null, '', id);
    const focusTarget = target.matches('section, main, div') ? target : null;
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
  });

  /* ------------------------------------------------------------------
     Header: solid after hero, hide on scroll down, show on scroll up
     ------------------------------------------------------------------ */
  const header = $('[data-header]');
  let lastY = window.scrollY;

  /* ------------------------------------------------------------------
     Mobile nav
     ------------------------------------------------------------------ */
  const nav = $('.nav');
  const navToggle = $('[data-nav-toggle]');
  function closeNav() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
  navToggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) $('a', nav).focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeNav(); navToggle.focus(); }
  });
  desktop.addEventListener('change', closeNav);

  // Mark the nav link of the section in view.
  const navLinks = $$('.nav__list a[href^="#"]:not(.btn)');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((l) => {
        if (l.getAttribute('href') === '#' + en.target.id) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['exhibition', 'stories', 'collection', 'boutique', 'visit', 'events'].forEach((id) => { const s = document.getElementById(id); if (s) sectionObs.observe(s); });

  /* ------------------------------------------------------------------
     Staggered reveals
     ------------------------------------------------------------------ */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealObs.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach((el) => revealObs.observe(el));

  /* ------------------------------------------------------------------
     HERO — the logo's diamond is an aperture that opens as you scroll
     ------------------------------------------------------------------ */
  const hero = $('[data-hero]');
  const heroSticky = $('.hero__sticky', hero);
  function heroFrame() {
    const vw = window.innerWidth, vh = heroSticky.clientHeight;
    const isDesk = desktop.matches;
    const short = vh < 700;
    const baseSize = isDesk ? Math.min(Math.min(vw, vh) * 0.64, 620) : Math.min(vw * (short ? 0.52 : 0.66), vh * (short ? 0.28 : 0.36));
    const cx0 = isDesk ? vw * (isRTL() ? 0.32 : 0.68) : vw * 0.5;
    const cy0 = isDesk ? vh * 0.5 : vh * (short ? 0.24 : 0.29);
    let p = 0;
    if (!reduced()) {
      const range = hero.offsetHeight - vh;
      p = range > 0 ? clamp(-hero.getBoundingClientRect().top / range) : 0;
    }
    // Ease the opening so it starts gently and finishes decisively.
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const fullSize = (vw + vh) * 1.45;
    const size = baseSize + (fullSize - baseSize) * e;
    heroSticky.style.setProperty('--p', p.toFixed(4));
    heroSticky.style.setProperty('--size', size.toFixed(1) + 'px');
    heroSticky.style.setProperty('--cx', (cx0 + (vw / 2 - cx0) * e).toFixed(1) + 'px');
    heroSticky.style.setProperty('--cy', (cy0 + (vh / 2 - cy0) * e).toFixed(1) + 'px');
  }

  /* ------------------------------------------------------------------
     EXHIBITION — panels drive the sticky image's framing
     ------------------------------------------------------------------ */
  const zoomImg = $('[data-exhibit-zoom] img');
  const caption = $('[data-exhibit-caption]');
  const dots = $$('[data-exhibit-dots] li');
  const panels = $$('[data-panel]');
  let activePanel = -1;
  function setPanel(i) {
    if (i === activePanel) return;
    activePanel = i;
    const p = panels[i];
    panels.forEach((el, j) => el.classList.toggle('is-active', j === i));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
    zoomImg.style.setProperty('--x', p.dataset.x);
    zoomImg.style.setProperty('--y', p.dataset.y);
    zoomImg.style.setProperty('--z', p.dataset.z);
    caption.classList.add('is-swapping');
    setTimeout(() => { caption.textContent = p.dataset.caption; caption.classList.remove('is-swapping'); }, reduced() ? 0 : 280);
  }
  const panelObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setPanel(panels.indexOf(en.target)); });
  }, { rootMargin: '-58% 0px -32% 0px' });
  panels.forEach((p) => panelObs.observe(p));
  setPanel(0);

  /* ------------------------------------------------------------------
     STORIES — pinned horizontal travel on desktop, native swipe elsewhere
     ------------------------------------------------------------------ */
  const stories = $('[data-stories]');
  const pin = $('[data-stories-pin]');
  const viewport = $('[data-stories-viewport]');
  const track = $('[data-stories-track]');
  const bar = $('[data-stories-bar]');
  const hint = $('[data-stories-hint]');
  const cards = $$('.story', track);
  let pinned = false, travel = 0;

  function layoutStories() {
    const shouldPin = desktop.matches && !reduced();
    pinned = shouldPin;
    stories.classList.toggle('is-pinned', shouldPin);
    if (shouldPin) {
      track.style.setProperty('--tx', '0px');
      travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
      stories.style.height = (pin.offsetHeight + travel) + 'px';
      hint.textContent = t('stories.scroll');
    } else {
      stories.style.height = '';
      track.style.removeProperty('--tx');
      hint.textContent = t('stories.swipe');
    }
    storiesFrame();
  }
  function storiesProgress() {
    if (pinned) {
      const range = stories.offsetHeight - pin.offsetHeight;
      return range > 0 ? clamp(-stories.getBoundingClientRect().top / range) : 0;
    }
    const max = viewport.scrollWidth - viewport.clientWidth;
    return max > 0 ? clamp(Math.abs(viewport.scrollLeft) / max) : 0;
  }
  function storiesFrame() {
    const p = storiesProgress();
    if (pinned) track.style.setProperty('--tx', ((isRTL() ? p : -p) * travel).toFixed(1) + 'px');
    bar.parentElement.style.setProperty('--sp', p.toFixed(4));
    bar.style.setProperty('--sp', p.toFixed(4));
  }
  viewport.addEventListener('scroll', () => { if (!pinned) storiesFrame(); }, { passive: true });

  // Scroll the page (pinned) or the rail (native) so a given card is in view.
  function goToCard(i, immediate = false) {
    i = clamp(i, 0, cards.length - 1);
    const card = cards[i];
    if (pinned) {
      viewport.scrollLeft = 0;
      const pad = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
      const tr = track.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const dist = isRTL() ? tr.right - cr.right : cr.left - tr.left;
      const x = clamp((dist - pad) / (travel || 1));
      const top = stories.getBoundingClientRect().top + window.scrollY + x * (stories.offsetHeight - pin.offsetHeight);
      if (lenis) lenis.scrollTo(top, { immediate, duration: 1.1 });
      else window.scrollTo({ top, behavior: immediate || reduced() ? 'auto' : 'smooth' });
    } else {
      card.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest', inline: 'start' });
    }
  }
  function currentCard() {
    const vr = viewport.getBoundingClientRect();
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const cr = c.getBoundingClientRect();
      const d = Math.abs(isRTL() ? vr.right - cr.right - 24 : cr.left - vr.left - 24);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
  $('[data-stories-prev]').addEventListener('click', () => goToCard(currentCard() - 1));
  $('[data-stories-next]').addEventListener('click', () => goToCard(currentCard() + 1));
  // Keyboard focus inside a pinned rail must bring the card on screen.
  track.addEventListener('focusin', (e) => {
    const card = e.target.closest('.story');
    if (!card) return;
    if (pinned) { viewport.scrollLeft = 0; goToCard(cards.indexOf(card), true); }
  });

  // Loupe: magnify under the pointer.
  $$('.story__media').forEach((btn) => {
    const loupe = $('.story__loupe', btn);
    const img = $('img', btn);
    if (!loupe) return;
    const zoom = 2.2;
    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      loupe.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      btn.classList.add('is-looking');
    });
    btn.addEventListener('pointermove', (e) => {
      if (!btn.classList.contains('is-looking')) return;
      const r = btn.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      loupe.style.setProperty('--lx', x + 'px');
      loupe.style.setProperty('--ly', y + 'px');
      const w = ir.width * zoom, h = ir.height * zoom;
      const px = (e.clientX - ir.left) * zoom, py = (e.clientY - ir.top) * zoom;
      loupe.style.backgroundSize = `${w}px ${h}px`;
      loupe.style.backgroundPosition = `${75 - px}px ${75 - py}px`;
    });
    btn.addEventListener('pointerleave', () => btn.classList.remove('is-looking'));
  });

  /* ------------------------------------------------------------------
     Lightbox (zoom view) — native <dialog> gives focus trap + Esc
     ------------------------------------------------------------------ */
  const lb = $('[data-lightbox]');
  const lbMedia = $('[data-lightbox-media]');
  let lbReturn = null;
  /* 3D coin: two faces back to back, with stacked silhouette layers for
     the thickness of the edge. Used in the timeline and the zoom view. */
  function coinMarkup(front, back, alt, layers, thin) {
    let edge = '';
    for (let i = 0; i < layers; i++) {
      const k = layers === 1 ? 0 : (i / (layers - 1) - 0.5);
      edge += `<img class="coin3d__edge" src="${front}" alt="" style="--k:${k.toFixed(3)}" draggable="false">`;
    }
    return `<span class="coin3d__body">
        <img class="coin3d__face coin3d__face--front" src="${front}" alt="${alt}" draggable="false">
        ${edge}
        <img class="coin3d__face coin3d__face--back" src="${back}" alt="" draggable="false">
      </span><span class="coin3d__shadow" aria-hidden="true"></span>`;
  }

  let coinSpin = null;
  function startCoinSpin(stage) {
    const body = $('.coin3d__body', stage);
    const front = $('.coin3d__face--front', stage);
    const back = $('.coin3d__face--back', stage);
    const shadow = $('.coin3d__shadow', stage);
    const btns = $$('[data-face]', stage.parentElement);
    const st = { angle: -24, vel: 0, target: null, drag: false, lastX: 0, hold: 0, raf: 0 };
    const auto = () => (reduced() ? 0 : 0.32);
    const frame = () => {
      if (st.target !== null) {
        const d = st.target - st.angle;
        st.angle = reduced() || Math.abs(d) < 0.2 ? st.target : st.angle + d * 0.1;
        if (st.angle === st.target) { st.target = null; st.hold = performance.now() + 2600; st.vel = 0; }
      } else if (!st.drag) {
        const want = performance.now() < st.hold ? 0 : auto();
        st.vel += (want - st.vel) * 0.04;
        st.angle += st.vel;
      }
      const c = Math.cos(st.angle * Math.PI / 180);
      body.style.transform = `rotateX(10deg) rotateY(${st.angle.toFixed(2)}deg)`;
      front.style.filter = `brightness(${(0.62 + 0.48 * Math.max(0, c)).toFixed(3)})`;
      back.style.filter = `brightness(${(0.62 + 0.48 * Math.max(0, -c)).toFixed(3)})`;
      shadow.style.transform = `scaleX(${(0.25 + 0.75 * Math.abs(c)).toFixed(3)})`;
      btns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.face === 'front') === (c >= 0))));
      st.raf = requestAnimationFrame(frame);
    };
    const toFace = (face) => {
      const base = Math.round(st.angle / 360) * 360;
      let t = base + (face === 'back' ? 180 : 0);
      if (Math.abs(t - st.angle) > 180) t += t > st.angle ? -360 : 360;
      st.target = t;
    };
    btns.forEach((b) => b.addEventListener('click', () => toFace(b.dataset.face)));
    stage.addEventListener('pointerdown', (e) => { st.drag = true; st.target = null; st.lastX = e.clientX; stage.setPointerCapture(e.pointerId); stage.classList.add('is-dragging'); });
    stage.addEventListener('pointermove', (e) => {
      if (!st.drag) return;
      const dx = e.clientX - st.lastX; st.lastX = e.clientX;
      st.angle += dx * 0.6; st.vel = dx * 0.6;
    });
    const end = () => { st.drag = false; st.hold = performance.now() + 1200; stage.classList.remove('is-dragging'); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -30, ArrowRight: 30 }[e.key];
      if (!step) return;
      e.preventDefault();
      st.target = (st.target ?? st.angle) + step;
    });
    st.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(st.raf);
  }

  // figures: [{ src, alt, label, cls }]  ·  coin: { front, back, alt }
  function openLightbox({ figures = [], coin, meta, title, body, returnTo }) {
    lbMedia.innerHTML = '';
    if (coinSpin) { coinSpin(); coinSpin = null; }
    if (coin) {
      const wrap = document.createElement('div');
      wrap.className = 'coin-viewer';
      wrap.innerHTML = `<div class="coin3d coin3d--large" tabindex="0" role="img" aria-label="${esc(coin.alt)} ${esc(t('coin.dragHelp'))}">${coinMarkup(esc(coin.front), esc(coin.back), '', 18)}</div>
        <div class="coin-viewer__ctrl" role="group" aria-label="${esc(t('coin.side'))}">
          <button type="button" class="filter" data-face="front" aria-pressed="true">${esc(t('coin.obverse'))}</button>
          <button type="button" class="filter" data-face="back" aria-pressed="false">${esc(t('coin.reverse'))}</button>
        </div>
        <p class="coin-viewer__hint" aria-hidden="true">${esc(t('coin.drag'))}</p>`;
      lbMedia.append(wrap);
      coinSpin = startCoinSpin($('.coin3d', wrap));
    }
    figures.forEach(({ src, alt, label, cls }) => {
      const f = document.createElement('figure');
      const img = document.createElement('img');
      img.className = cls; img.src = src; img.alt = alt;
      f.append(img);
      if (label) { const c = document.createElement('figcaption'); c.textContent = label; f.append(c); }
      lbMedia.append(f);
    });
    $('[data-lightbox-meta]').textContent = meta || '';
    $('[data-lightbox-title]').textContent = title || '';
    $('[data-lightbox-body]').textContent = body || '';
    lbReturn = returnTo;
    if (lenis) lenis.stop();
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    $('[data-lightbox-close]').focus();
  }
  $$('[data-zoom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.story');
      const key = btn.dataset.zoom;
      const isCoin = /^\d$/.test(key);
      openLightbox({
        coin: isCoin ? { front: `assets/coin${key}a.webp`, back: `assets/coin${key}b.webp`, alt: t('coin.alt3d') } : null,
        figures: isCoin ? [] : [{ src: `assets/${key}-1100.webp`, alt: t('blanks.alt'), cls: 'photo' }],
        meta: $('.story__meta', card).textContent,
        title: $('.story__title', card).textContent,
        body: $$('.story__body p:not(.story__meta)', card).map((p) => p.textContent).join(' '),
        returnTo: btn,
      });
    });
  });
  const closeLb = () => { if (lb.open) lb.close(); };
  $('[data-lightbox-close]').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__inner')) closeLb(); });
  lb.addEventListener('close', () => { if (coinSpin) { coinSpin(); coinSpin = null; } if (lenis) lenis.start(); if (lbReturn) lbReturn.focus({ preventScroll: true }); });

  /* ------------------------------------------------------------------
     COLLECTIONS — tabs (Numismatique / Artistique)
     ------------------------------------------------------------------ */
  const tabs = $$('[data-tabs] [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (lenis) lenis.resize();
    onScroll();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const fwd = isRTL() ? -1 : 1;
      const keys = { ArrowRight: i + fwd, ArrowLeft: i - fwd, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      selectTab(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
    });
  });

  /* ------------------------------------------------------------------
     NUMISMATIC TIMELINE — rendered from collection-data.js
     ------------------------------------------------------------------ */
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad2 = (n) => String(n).padStart(2, '0');
  const timelineEl = $('[data-timeline]');
  const eraList = $('[data-era-list]');
  const eraBar = $('[data-era-bar]');
  const phases = Array.isArray(window.BAM_COLLECTION) ? window.BAM_COLLECTION : [];

  function renderGroup(phase, g, gi) {
    const kind = g.kind || 'coin';
    const photos = g.photos || [];
    const descs = g.descriptions || [];
    const nPhotos = Math.max(g.photoCount || 0, photos.length);
    const nDescs = Math.max(g.descriptionCount || 0, descs.length);
    const gid = `${phase.id}-${gi}`;
    let slots = '';
    for (let i = 0; i < nPhotos; i++) {
      const p = photos[i];
      if (p && p.src) {
        const cap = L(p.caption), alt = L(p.alt);
        slots += `<li class="slot slot--${kind}"><button type="button" class="slot__btn" data-photo="${gid}:${i}" data-cursor="${esc(t('a.zoom'))}" aria-label="${esc(t('tl.enlarge', { x: cap || alt || t('tl.photo') }))}">
          <span class="slot__frame">${p.reverse
            ? `<span class="coin3d${kind === 'note' ? ' coin3d--thin' : ''}" style="--d:${(-(i * 2.7) % 16).toFixed(1)}s">${coinMarkup(esc(p.src), esc(p.reverse), esc(alt), kind === 'note' ? 1 : 5)}</span>`
            : `<img src="${esc(p.src)}" alt="${esc(alt)}" loading="lazy">`}</span></button>
          <p class="slot__cap">${esc(cap)}</p></li>`;
      } else {
        slots += `<li class="slot slot--${kind} slot--empty" aria-hidden="true"><span class="slot__frame">
          <svg class="slot__mark" viewBox="0 0 100 100"><use href="#diamond"/></svg>
          <span class="slot__count">${pad2(i + 1)} / ${pad2(nPhotos)}</span></span>
          <p class="slot__cap">${esc(t('tl.photoSoon'))}</p></li>`;
      }
    }
    let notes = '';
    for (let i = 0; i < nDescs; i++) {
      const d = descs[i];
      notes += d
        ? `<li class="note"><span class="note__num" aria-hidden="true">${pad2(i + 1)}</span><div>${d.title ? `<h5 class="note__title">${esc(L(d.title))}</h5>` : ''}<p>${esc(L(d.text))}</p></div></li>`
        : `<li class="note note--empty" aria-hidden="true"><span class="note__num">${pad2(i + 1)}</span><div><p>${esc(t('tl.descSoon'))}</p></div></li>`;
    }
    const filled = photos.filter((p) => p && p.src).length;
    const labelId = `grp-${gid}`;
    return `<div class="group">
      ${g.label ? `<h4 class="group__title" id="${labelId}">${esc(L(g.label))} <span class="group__count">${esc(t('tl.counts', { p: nPhotos, d: nDescs }))}</span></h4>` : ''}
      <div class="rail">
        <ul class="rail__track" role="list" tabindex="0" aria-label="${esc(t('tl.rail', { label: L(g.label) || L(phase.title), n: filled, total: nPhotos }))}">${slots}</ul>
        <div class="rail__btns">
          <button type="button" class="icon-btn icon-btn--sm" data-rail="-1" aria-label="${esc(t('tl.left'))}"><span aria-hidden="true">←</span></button>
          <button type="button" class="icon-btn icon-btn--sm" data-rail="1" aria-label="${esc(t('tl.right'))}"><span aria-hidden="true">→</span></button>
        </div>
      </div>
      <p class="sr-only">${esc(t('tl.descAvail', { n: descs.length, total: nDescs }))}</p>
      <ol class="notes" role="list">${notes}</ol>
    </div>`;
  }

  // Observers live for the whole page; renderTimeline() re-attaches them.
  let eras = [], eraLinks = [];
  const revealedEras = new Set();
  const spinObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('is-spinning', en.isIntersecting));
  }, { rootMargin: '100px' });
  const eraObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const i = eras.indexOf(en.target);
      eraLinks.forEach((a, j) => { if (j === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); a.classList.toggle('is-past', j < i); });
      const active = eraLinks[i];
      if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  const revealEra = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealedEras.add(en.target.id);
      revealEra.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  function renderTimeline() {
    if (!timelineEl || !phases.length) return;
    spinObs.disconnect(); eraObs.disconnect(); revealEra.disconnect();
    timelineEl.innerHTML = phases.map((ph, i) => `
      <article class="era${revealedEras.has('era-' + ph.id) ? ' is-in' : ''}" id="era-${esc(ph.id)}" aria-labelledby="era-title-${esc(ph.id)}" data-era>
        <header class="era__head">
          <span class="era__num" aria-hidden="true">${ROMAN[i] || i + 1}</span>
          <p class="era__phase">${esc(t('tl.phase'))} · ${pad2(i + 1)} / ${pad2(phases.length)}</p>
          <h3 class="era__title" id="era-title-${esc(ph.id)}">${esc(L(ph.title))}</h3>
          <p class="era__range"><span>${esc(L(ph.from))}</span><span class="era__arrow" aria-hidden="true"></span><span class="sr-only">${esc(t('tl.to'))}</span><span>${esc(L(ph.to))}</span></p>
          ${ph.intro ? `<p class="era__intro">${esc(L(ph.intro))}</p>` : ''}
        </header>
        <div class="era__body">${(ph.groups || []).map((g, gi) => renderGroup(ph, g, gi)).join('')}</div>
      </article>`).join('');
    eraList.innerHTML = phases.map((ph, i) => `<li><a href="#era-${esc(ph.id)}"><span class="era-nav__num">${ROMAN[i] || i + 1}</span><span class="era-nav__label">${esc(L(ph.short) || L(ph.title))}</span></a></li>`).join('');
    eras = $$('[data-era]', timelineEl);
    eraLinks = $$('a', eraList);
    $$('.coin3d', timelineEl).forEach((c) => spinObs.observe(c));
    eras.forEach((el) => { eraObs.observe(el); if (!el.classList.contains('is-in')) revealEra.observe(el); });
  }

  if (timelineEl && phases.length) {
    timelineEl.addEventListener('click', (e) => {
      const rb = e.target.closest('[data-rail]');
      if (rb) {
        const track = $('.rail__track', rb.closest('.rail'));
        track.scrollBy({ left: Number(rb.dataset.rail) * track.clientWidth * 0.8, behavior: reduced() ? 'auto' : 'smooth' });
        return;
      }
      const pb = e.target.closest('[data-photo]');
      if (!pb) return;
      const [gid, idx] = pb.dataset.photo.split(':');
      const cut = gid.lastIndexOf('-');
      const ph = phases.find((x) => x.id === gid.slice(0, cut));
      const g = ph.groups[Number(gid.slice(cut + 1))];
      const p = g.photos[Number(idx)];
      const cls = (g.kind || 'coin') === 'coin' ? 'coin' : 'photo';
      openLightbox({
        coin: p.reverse ? { front: p.src, back: p.reverse, alt: L(p.alt) } : null,
        figures: p.reverse ? [] : [{ src: p.src, alt: L(p.alt), cls }],
        meta: `${L(ph.title)}${g.label ? ' · ' + L(g.label) : ''}`, title: L(p.caption), body: L(p.text), returnTo: pb });
    });
    renderTimeline();
  }
  function eraProgress() {
    if (!eraBar || !timelineEl || timelineEl.closest('[hidden]')) return;
    const r = timelineEl.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.45 - r.top) / (r.height || 1));
    eraBar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  /* ------------------------------------------------------------------
     COLLECTION — gentle parallax + hover tilt
     ------------------------------------------------------------------ */
  const tiles = $$('.tile');
  function parallaxFrame() {
    if (reduced() || !desktop.matches) { tiles.forEach((t) => t.style.removeProperty('--py')); return; }
    const vh = window.innerHeight;
    tiles.forEach((t) => {
      const r = t.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = (r.top + r.height / 2 - vh / 2);
      t.style.setProperty('--py', (-d * parseFloat(t.dataset.speed || 0)).toFixed(1) + 'px');
    });
  }
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('is-tilting');
      el.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    });
  });

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.setProperty('--mx', (x * 0.28).toFixed(1) + 'px');
      el.style.setProperty('--my', (y * 0.38).toFixed(1) + 'px');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
  });

  /* ------------------------------------------------------------------
     Custom cursor — only over artwork, only with a fine pointer
     ------------------------------------------------------------------ */
  const cursor = $('.cursor');
  const cursorLabel = $('.cursor__label');
  let cx = -100, cy = -100, tx = -100, ty = -100, cursorOn = false, cursorRaf = 0;
  function cursorLoop() {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cursor.style.setProperty('--cx', cx.toFixed(1) + 'px');
    cursor.style.setProperty('--cy', cy.toFixed(1) + 'px');
    cursorRaf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3) ? requestAnimationFrame(cursorLoop) : 0;
  }
  if (finePointer.matches) {
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      tx = e.clientX; ty = e.clientY;
      const art = e.target.closest('[data-cursor]');
      if (art) {
        if (!cursorOn) { cx = tx; cy = ty; }
        cursorLabel.textContent = art.dataset.cursor;
        cursor.classList.add('is-on');
        cursorOn = true;
      } else if (cursorOn) {
        cursor.classList.remove('is-on');
        cursorOn = false;
      }
      if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorLoop);
    }, { passive: true });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => { cursor.classList.remove('is-on'); cursorOn = false; });
  }

  /* ------------------------------------------------------------------
     Scroll loop (one rAF per frame for everything scroll-driven)
     ------------------------------------------------------------------ */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle('is-solid', y > 40);
      if (!nav.classList.contains('is-open')) header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight && !reduced());
      if (y < lastY) header.classList.remove('is-hidden');
      root.classList.toggle('header-hidden', header.classList.contains('is-hidden'));
      lastY = y;
      heroFrame();
      if (pinned) storiesFrame();
      parallaxFrame();
      eraProgress();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { layoutStories(); onScroll(); }, 120); });
  window.addEventListener('load', () => { layoutStories(); onScroll(); });

  /* ------------------------------------------------------------------
     Reduced motion — OS preference + in-page toggle
     ------------------------------------------------------------------ */
  const motionBtn = $('[data-motion-toggle]');
  function applyMotion() {
    const r = reduced();
    motionBtn.setAttribute('aria-pressed', String(r));
    motionBtn.textContent = r ? t('motion.on') : t('motion.off');
    motionBtn.disabled = osReduce.matches;
    if (osReduce.matches) motionBtn.title = t('motion.system');
    if (r) { stopLenis(); cursor.classList.remove('is-on'); } else startLenis();
    layoutStories(); onScroll();
  }
  motionBtn.addEventListener('click', () => {
    const on = !root.classList.contains('reduce-motion');
    root.classList.toggle('reduce-motion', on);
    try { localStorage.setItem('bam-motion', on ? 'reduce' : 'full'); } catch (e) { /* storage unavailable */ }
    applyMotion();
  });
  osReduce.addEventListener('change', applyMotion);
  desktop.addEventListener('change', () => { layoutStories(); onScroll(); });

  /* ------------------------------------------------------------------
     TICKETS — date → tickets → confirm (front-end demo; no payment)
     ------------------------------------------------------------------ */
  const form = $('[data-ticket-form]');
  const calEl = $('[data-cal]');
  const stepsEls = { 1: $('[data-step="1"]'), 2: $('[data-step="2"]'), 3: $('[data-step="3"]'), done: $('[data-step="done"]') };
  const stepLabels = $$('.steps__item');
  const nextBtn = $('[data-next]');
  const backBtn = $('[data-back]');
  const navRow = $('[data-ticket-nav]');
  const live = $('[data-ticket-live]');
  const PRICES = { adult: 20, reduced: 10, child: 0 };
  const TOUR = 30;
  const state = { step: 1, date: null, slot: '10:00', counts: { adult: 1, reduced: 0, child: 0 }, tour: false };
  let fmtLong, fmtShort, fmtMonth, fmtDow;
  function makeFormatters() {
    const loc = I18N.locale();
    fmtLong = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    fmtShort = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' });
    fmtMonth = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' });
    fmtDow = new Intl.DateTimeFormat(loc, { weekday: I18N.lang === 'ar' ? 'narrow' : 'short' });
  }
  makeFormatters();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today); lastDay.setDate(lastDay.getDate() + 90);
  let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const isOpen = (d) => d.getDay() !== 1 && d >= today && d <= lastDay; // closed Mondays
  const sameDay = (a, b) => !!(a && b && a.getTime() === b.getTime());
  const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  function renderCal(focusDate) {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
    const first = new Date(y, m, 1);
    const days = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    const canPrev = viewMonth > new Date(today.getFullYear(), today.getMonth(), 1);
    const canNext = new Date(y, m + 1, 1) <= lastDay;
    let html = `<div class="cal__head"><p class="cal__month" id="cal-month" aria-live="polite">${fmtMonth.format(first)}</p>
      <div class="cal__nav"><button type="button" class="icon-btn icon-btn--sm" data-cal-prev aria-label="${t('cal.prev')}" ${canPrev ? '' : 'disabled'}><span aria-hidden="true" class="flip-rtl">←</span></button>
      <button type="button" class="icon-btn icon-btn--sm" data-cal-next aria-label="${t('cal.next')}" ${canNext ? '' : 'disabled'}><span aria-hidden="true" class="flip-rtl">→</span></button></div></div>
      <div class="cal__grid" role="group" aria-labelledby="cal-month">`;
    for (let k = 0; k < 7; k++) html += `<span class="cal__dow" aria-hidden="true">${fmtDow.format(new Date(2024, 0, 1 + k))}</span>`; // 1 Jan 2024 was a Monday
    for (let i = 0; i < lead; i++) html += '<span class="cal__empty" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const open = isOpen(date);
      const sel = sameDay(date, state.date);
      const label = date.getDay() === 1 ? t('cal.closed', { date: fmtLong.format(date) }) : (!open ? t('cal.unavailable', { date: fmtLong.format(date) }) : fmtLong.format(date));
      html += `<button type="button" class="cal__day${sameDay(date, today) ? ' is-today' : ''}" data-date="${ymd(date)}" aria-label="${label}" aria-pressed="${sel}" ${open ? '' : 'disabled'} tabindex="-1">${d}</button>`;
    }
    html += '</div>';
    calEl.innerHTML = html;
    // Roving tabindex: one tab stop into the grid.
    const btns = $$('button.cal__day:not(:disabled)', calEl);
    const target = (focusDate && btns.find((b) => b.dataset.date === ymd(focusDate))) || btns.find((b) => b.getAttribute('aria-pressed') === 'true') || btns[0];
    if (target) { target.tabIndex = 0; if (focusDate) target.focus(); }
  }
  function parseYmd(s) { return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); }

  calEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-cal-prev]')) { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); renderCal(); return; }
    if (e.target.closest('[data-cal-next]')) { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); renderCal(); return; }
    const b = e.target.closest('.cal__day');
    if (!b || b.disabled) return;
    state.date = parseYmd(b.dataset.date);
    renderCal(state.date);
    updateSummary();
    live.textContent = t('cal.selected', { date: fmtLong.format(state.date) });
  });
  calEl.addEventListener('keydown', (e) => {
    const b = e.target.closest('.cal__day');
    if (!b) return;
    const fwd = isRTL() ? -1 : 1; // in Arabic the week runs right to left
    const deltas = { ArrowLeft: -fwd, ArrowRight: fwd, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in deltas) && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    let d = parseYmd(b.dataset.date);
    if (e.key === 'Home') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    else if (e.key === 'End') d.setDate(d.getDate() + (6 - (d.getDay() + 6) % 7));
    else {
      const step = deltas[e.key];
      // Skip over closed days in the direction of travel.
      let guard = 0;
      do { d.setDate(d.getDate() + step); guard++; } while (!isOpen(d) && d >= today && d <= lastDay && guard < 14);
    }
    if (!isOpen(d)) return;
    if (d.getMonth() !== viewMonth.getMonth()) viewMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    renderCal(d);
  });

  $$('input[name="slot"]', form).forEach((r) => r.addEventListener('change', () => { state.slot = r.value; updateSummary(); }));

  $$('.qty', form).forEach((row) => {
    const type = row.dataset.type;
    const out = $('[data-count]', row);
    const dec = $('[data-dec]', row);
    const sync = () => { out.textContent = state.counts[type]; dec.disabled = state.counts[type] === 0; updateSummary(); };
    dec.addEventListener('click', () => { state.counts[type] = Math.max(0, state.counts[type] - 1); sync(); });
    $('[data-inc]', row).addEventListener('click', () => { state.counts[type] = Math.min(20, state.counts[type] + 1); sync(); });
    sync();
  });
  $('[data-tour]', form).addEventListener('change', (e) => { state.tour = e.target.checked; updateSummary(); });

  function totalTickets() { return state.counts.adult + state.counts.reduced + state.counts.child; }
  function total() {
    return Object.entries(state.counts).reduce((s, [k, n]) => s + PRICES[k] * n, 0) + (state.tour ? TOUR : 0);
  }
  function ticketText() {
    const parts = [];
    const { adult, reduced: red, child } = state.counts;
    if (adult) parts.push(I18N.plural('tix.adult', adult));
    if (red) parts.push(I18N.plural('tix.reduced', red));
    if (child) parts.push(I18N.plural('tix.child', child));
    if (state.tour) parts.push(t('tix.tourItem'));
    return parts.join(isRTL() ? '، ' : ', ') || '—';
  }
  function money(n) { return n === 0 ? t('tix.free') : t('tix.mad', { n }); }
  function nextLabel() {
    $('span', nextBtn).textContent = state.step === 3 ? t('tix.confirm', { total: money(total()) }) : t('tix.continue');
  }
  function renderDone() {
    if (!state.date || !state.ref) return;
    $('[data-done-title]').textContent = t('done.title', { date: t('done.when', { date: fmtLong.format(state.date), time: state.slot }) });
    $('[data-done-body]').innerHTML = t('done.body', { ref: `<strong class="done__ref">${esc(state.ref)}</strong>`, email: esc(state.email || '') });
  }
  function updateSummary() {
    $('[data-sum-date]').textContent = state.date ? fmtShort.format(state.date) : '—';
    $('[data-sum-slot]').textContent = state.slot;
    $('[data-sum-tickets]').textContent = ticketText();
    const sum = total();
    $('[data-sum-total]').textContent = money(sum);
    if (state.step === 1) nextBtn.disabled = !state.date;
    if (state.step === 2) nextBtn.disabled = totalTickets() === 0;
  }

  function goStep(n) {
    const prev = state.step;
    state.step = n;
    Object.entries(stepsEls).forEach(([k, el]) => { el.hidden = String(k) !== String(n); el.classList.remove('is-entering'); el.classList.toggle('is-active', String(k) === String(n)); });
    const cur = stepsEls[n];
    void cur.offsetWidth;
    cur.classList.add('is-entering');
    stepLabels.forEach((li, i) => {
      const idx = i + 1;
      const numeric = n === 'done' ? 4 : n;
      li.classList.toggle('is-current', idx === numeric);
      li.classList.toggle('is-done', idx < numeric);
      if (idx === numeric) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    backBtn.hidden = n === 1 || n === 'done';
    navRow.hidden = n === 'done';
    nextLabel();
    updateSummary();
    if (n === 1) { const b = $('.cal__day[tabindex="0"]', calEl); if (b && prev !== 1) b.focus(); }
    if (n === 2) $('[data-inc]', stepsEls[2]).focus();
    if (n === 3) $('#t-name').focus();
    if (n === 'done') cur.focus();
    live.textContent = n === 'done' ? t('tix.done') : t('tix.step', { n });
  }

  backBtn.addEventListener('click', () => goStep(state.step - 1));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.step === 1) { if (state.date) goStep(2); return; }
    if (state.step === 2) { if (totalTickets() > 0) goStep(3); return; }
    if (state.step === 3) {
      const name = $('#t-name');
      const email = $('#t-email');
      const err = $('[data-error]', stepsEls[3]);
      const nameOk = name.value.trim().length > 1;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      name.setAttribute('aria-invalid', String(!nameOk));
      email.setAttribute('aria-invalid', String(!emailOk));
      state.emailErr = !emailOk;
      err.textContent = emailOk ? '' : t('tix.emailErr');
      if (!nameOk) { name.focus(); return; }
      if (!emailOk) { email.focus(); return; }
      const ref = 'BAM-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      state.ref = ref;
      state.email = email.value.trim();
      renderDone();
      goStep('done');
    }
  });

  $('[data-ics]').addEventListener('click', () => {
    const [h, mi] = state.slot.split(':').map(Number);
    const pad = (n) => String(n).padStart(2, '0');
    const d = state.date;
    const start = `${ymd(d)}T${pad(h)}${pad(mi)}00`;
    const end = `${ymd(d)}T${pad(h + 2)}${pad(mi)}00`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Musees de Bank Al-Maghrib//Tickets//EN',
      'BEGIN:VEVENT', `UID:${state.ref}@musees-bam`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=Africa/Casablanca:${start}`, `DTEND;TZID=Africa/Casablanca:${end}`,
      `SUMMARY:${t('ics.summary')}`, `DESCRIPTION:${t('ics.booking')} ${state.ref} · ${ticketText()}`,
      'LOCATION:Avenue Mohammed V\\, Rabat', 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${state.ref}.ics` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('[data-restart]').addEventListener('click', () => {
    state.date = null; form.reset(); state.slot = '10:00'; state.tour = false;
    state.counts = { adult: 1, reduced: 0, child: 0 };
    $$('.qty', form).forEach((row) => { $('[data-count]', row).textContent = state.counts[row.dataset.type]; $('[data-dec]', row).disabled = state.counts[row.dataset.type] === 0; });
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCal();
    goStep(1);
    const b = $('.cal__day[tabindex="0"]', calEl); if (b) b.focus();
  });

  renderCal();
  goStep(1);

  /* ------------------------------------------------------------------
     EVENTS — filter by type
     ------------------------------------------------------------------ */
  const filterBtns = $$('[data-filter]');
  const eventItems = $$('[data-events] .event');
  const eventsEmpty = $('[data-events-empty]');
  const eventsLive = $('[data-events-live]');
  function renderEventDates() {
    const fmt = new Intl.DateTimeFormat(I18N.locale(), { month: 'short' });
    eventItems.forEach((el) => {
      const d = new Date($('time', el).getAttribute('datetime') + 'T12:00:00');
      $('.event__mon', el).textContent = fmt.format(d);
    });
  }
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const show = (el) => type === 'all' || el.dataset.type === type;
    const leaving = eventItems.filter((el) => !el.hidden && !show(el));
    leaving.forEach((el) => el.classList.add('is-leaving'));
    setTimeout(() => {
      let n = 0;
      eventItems.forEach((el, i) => {
        const vis = show(el);
        const wasHidden = el.hidden;
        el.hidden = !vis;
        el.classList.remove('is-leaving', 'is-entering');
        if (vis) { n++; if (wasHidden) { el.style.animationDelay = (n * 50) + 'ms'; void el.offsetWidth; el.classList.add('is-entering'); } }
      });
      eventsEmpty.hidden = n > 0;
      eventsLive.textContent = I18N.plural('ev.shown', n);
      if (lenis) lenis.resize();
    }, leaving.length && !reduced() ? 320 : 0);
  }));

  /* ------------------------------------------------------------------
     Newsletter (front-end only)
     ------------------------------------------------------------------ */
  const news = $('[data-news]');
  const newsMsg = $('[data-news-msg]');
  news.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', news);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    newsMsg.className = 'news__msg ' + (ok ? 'is-ok' : 'is-err');
    newsMsg.dataset.key = ok ? 'news.ok' : 'news.err';
    newsMsg.textContent = t(newsMsg.dataset.key);
    if (ok) news.reset(); else input.focus();
  });

  /* ------------------------------------------------------------------
     BOUTIQUE — shelves (data: BAM_SHOP_COINS, BAM_SHOP_NOTES)
     ------------------------------------------------------------------ */
  const SHELVES = [
    { key: 'coins', items: window.BAM_SHOP_COINS, kind: 'coin', title: 'shelf.title', rail: 'shelf.rail' },
    { key: 'notes', items: window.BAM_SHOP_NOTES, kind: 'note', title: 'notes.title', rail: 'notes.rail' },
    { key: 'tools', items: window.BAM_SHOP_TOOLS, kind: 'product', title: 'tools.title', rail: 'tools.rail' },
    { key: 'souvenirs', items: window.BAM_SHOP_SOUVENIRS, kind: 'product', title: 'souv.title', rail: 'souv.rail' },
  ].map((sh) => ({ ...sh, items: Array.isArray(sh.items) ? sh.items : [], el: $(`[data-shelf="${sh.key}"]`) }))
    .filter((sh) => sh.el);
  function renderShelf() {
    SHELVES.forEach((sh) => {
      $$('.coin3d', sh.el).forEach((c) => spinObs.unobserve(c));
      sh.el.setAttribute('aria-label', t(sh.rail, { n: sh.items.length }));
      sh.el.innerHTML = sh.items.map((p, i) => {
        const cap = L(p.caption), alt = L(p.alt);
        return `<li class="slot slot--${sh.kind} slot--shop"><button type="button" class="slot__btn" data-shop-item="${i}" data-cursor="${esc(t('a.zoom'))}" aria-label="${esc(t('tl.enlarge', { x: cap || alt }))}">
            <span class="slot__frame">${p.reverse
              ? `<span class="coin3d${sh.kind === 'note' ? ' coin3d--thin' : ''}" style="--d:${(-(i * 3.1) % 16).toFixed(1)}s">${coinMarkup(esc(p.src), esc(p.reverse), esc(alt), sh.kind === 'note' ? 1 : 6)}</span>`
              : `<img${p.cover ? ' class="slot__photo"' : ''} src="${esc(p.src)}" alt="${esc(alt)}" loading="lazy">`}</span></button>
            <p class="slot__cap">${esc(cap)}</p></li>`;
      }).join('');
      $$('.coin3d', sh.el).forEach((c) => spinObs.observe(c));
    });
  }
  SHELVES.forEach((sh) => {
    sh.el.closest('.shelf').addEventListener('click', (e) => {
      const rb = e.target.closest('[data-rail]');
      if (rb) {
        sh.el.scrollBy({ left: Number(rb.dataset.rail) * sh.el.clientWidth * 0.8, behavior: reduced() ? 'auto' : 'smooth' });
        return;
      }
      const b = e.target.closest('[data-shop-item]');
      if (!b) return;
      const p = sh.items[Number(b.dataset.shopItem)];
      openLightbox({
        coin: p.reverse ? { front: p.src, back: p.reverse, alt: L(p.alt) } : null,
        figures: p.reverse ? [] : [{ src: p.src, alt: L(p.alt), cls: sh.kind === 'product' ? (p.cover ? 'photo' : 'photo product') : (p.cover || sh.kind === 'note') ? 'photo' : 'coin' }],
        meta: t(sh.title), title: L(p.caption), body: L(p.text), returnTo: b });
    });
  });
  renderShelf();

  /* ------------------------------------------------------------------
     LANGUAGE — flag menu; everything drawn by JS is redrawn on change
     ------------------------------------------------------------------ */
  const langBox = $('[data-lang]');
  const langBtn = $('[data-lang-btn]');
  const langMenu = $('[data-lang-menu]');
  const FLAGS = { fr: 'flag-fr', ar: 'flag-ma', en: 'flag-gb', es: 'flag-es' };
  const NAMES = { fr: 'Français', ar: 'العربية', en: 'English', es: 'Español' };
  const langItems = $$('[data-set-lang]', langMenu);
  function openLang(open) {
    langMenu.hidden = !open;
    langBtn.setAttribute('aria-expanded', String(open));
    if (open) (langItems.find((b) => b.dataset.setLang === I18N.lang) || langItems[0]).focus();
  }
  langBtn.addEventListener('click', () => openLang(langMenu.hidden));
  langMenu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set-lang]');
    if (!b) return;
    openLang(false);
    langBtn.focus();
    if (b.dataset.setLang !== I18N.lang) I18N.set(b.dataset.setLang, { save: true });
  });
  document.addEventListener('click', (e) => { if (!langMenu.hidden && !langBox.contains(e.target)) openLang(false); });
  langBox.addEventListener('keydown', (e) => {
    if (langMenu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); openLang(false); langBtn.focus(); return; }
    const i = langItems.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + langItems.length) % langItems.length;
      langItems[n].focus();
    }
  });
  langBox.addEventListener('focusout', (e) => { if (!langMenu.hidden && !langBox.contains(e.relatedTarget)) openLang(false); });

  function onLangChange(lang) {
    $('use', langBtn).setAttribute('href', '#' + FLAGS[lang]);
    $('[data-lang-code]', langBtn).textContent = lang.toUpperCase();
    langBtn.setAttribute('aria-label', `${t('lang.label')}: ${NAMES[lang]}`);
    langItems.forEach((b) => { if (b.dataset.setLang === lang) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    makeFormatters();
    if (activePanel > -1) caption.textContent = panels[activePanel].dataset.caption;
    renderTimeline();
    renderShelf();
    renderCal();
    updateSummary();
    nextLabel();
    if (state.step === 'done') renderDone();
    if (state.emailErr) $('[data-error]', stepsEls[3]).textContent = t('tix.emailErr');
    renderEventDates();
    if (newsMsg.dataset.key) newsMsg.textContent = t(newsMsg.dataset.key);
    applyMotion(); // also re-measures the Stories rail, whose width depends on the text
    if (lenis) lenis.resize();
  }
  I18N.onChange(onLangChange);
  onLangChange(I18N.lang);
})();
