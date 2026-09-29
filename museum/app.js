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
  ['exhibition', 'stories', 'collection', 'visit', 'events'].forEach((id) => { const s = document.getElementById(id); if (s) sectionObs.observe(s); });

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
    const cx0 = isDesk ? vw * 0.68 : vw * 0.5;
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
      hint.textContent = 'Scroll to travel · select a coin to zoom';
    } else {
      stories.style.height = '';
      track.style.removeProperty('--tx');
      hint.textContent = 'Swipe to travel · tap a coin to zoom';
    }
    storiesFrame();
  }
  function storiesProgress() {
    if (pinned) {
      const range = stories.offsetHeight - pin.offsetHeight;
      return range > 0 ? clamp(-stories.getBoundingClientRect().top / range) : 0;
    }
    const max = viewport.scrollWidth - viewport.clientWidth;
    return max > 0 ? clamp(viewport.scrollLeft / max) : 0;
  }
  function storiesFrame() {
    const p = storiesProgress();
    if (pinned) track.style.setProperty('--tx', (-p * travel).toFixed(1) + 'px');
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
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const x = clamp((card.offsetLeft - pad) / (travel || 1));
      const top = stories.getBoundingClientRect().top + window.scrollY + x * (stories.offsetHeight - pin.offsetHeight);
      if (lenis) lenis.scrollTo(top, { immediate, duration: 1.1 });
      else window.scrollTo({ top, behavior: immediate || reduced() ? 'auto' : 'smooth' });
    } else {
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      viewport.scrollTo({ left: card.offsetLeft - pad, behavior: reduced() ? 'auto' : 'smooth' });
    }
  }
  function currentCard() {
    const vpLeft = viewport.getBoundingClientRect().left;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - vpLeft - 24); if (d < bestD) { bestD = d; best = i; } });
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
  $$('[data-zoom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.story');
      const key = btn.dataset.zoom;
      lbMedia.innerHTML = '';
      if (/^\d$/.test(key)) {
        [['a', 'Obverse'], ['b', 'Reverse']].forEach(([s, label]) => {
          const f = document.createElement('figure');
          f.innerHTML = `<img class="coin" src="assets/coin${key}${s}.webp" alt="${label} of the coin, enlarged"><figcaption>${label}</figcaption>`;
          lbMedia.append(f);
        });
      } else {
        const f = document.createElement('figure');
        f.innerHTML = `<img class="photo" src="assets/${key}-1100.webp" alt="Coin blanks, enlarged">`;
        lbMedia.append(f);
      }
      $('[data-lightbox-meta]').textContent = $('.story__meta', card).textContent;
      $('[data-lightbox-title]').textContent = $('.story__title', card).textContent;
      $('[data-lightbox-body]').textContent = $$('.story__body p:not(.story__meta)', card).map((p) => p.textContent).join(' ');
      lbReturn = btn;
      if (lenis) lenis.stop();
      if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
      $('[data-lightbox-close]').focus();
    });
  });
  const closeLb = () => { if (lb.open) lb.close(); };
  $('[data-lightbox-close]').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__inner')) closeLb(); });
  lb.addEventListener('close', () => { if (lenis) lenis.start(); if (lbReturn) lbReturn.focus({ preventScroll: true }); });

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
      lastY = y;
      heroFrame();
      if (pinned) storiesFrame();
      parallaxFrame();
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
    motionBtn.textContent = r ? 'Motion reduced' : 'Reduce motion';
    motionBtn.disabled = osReduce.matches;
    if (osReduce.matches) motionBtn.title = 'Reduced motion is set by your system';
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
  const fmtLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtMonth = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

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
      <div class="cal__nav"><button type="button" class="icon-btn icon-btn--sm" data-cal-prev aria-label="Previous month" ${canPrev ? '' : 'disabled'}>←</button>
      <button type="button" class="icon-btn icon-btn--sm" data-cal-next aria-label="Next month" ${canNext ? '' : 'disabled'}>→</button></div></div>
      <div class="cal__grid" role="group" aria-labelledby="cal-month">`;
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => { html += `<span class="cal__dow" aria-hidden="true">${d}</span>`; });
    for (let i = 0; i < lead; i++) html += '<span class="cal__empty" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const open = isOpen(date);
      const sel = sameDay(date, state.date);
      const label = fmtLong.format(date) + (date.getDay() === 1 ? ', closed' : (!open ? ', unavailable' : ''));
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
    live.textContent = `Selected ${fmtLong.format(state.date)}.`;
  });
  calEl.addEventListener('keydown', (e) => {
    const b = e.target.closest('.cal__day');
    if (!b) return;
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
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
    if (adult) parts.push(`${adult} adult${adult > 1 ? 's' : ''}`);
    if (red) parts.push(`${red} reduced`);
    if (child) parts.push(`${child} under 18`);
    if (state.tour) parts.push('guided tour');
    return parts.join(', ') || '—';
  }
  function updateSummary() {
    $('[data-sum-date]').textContent = state.date ? fmtShort.format(state.date) : '—';
    $('[data-sum-slot]').textContent = state.slot;
    $('[data-sum-tickets]').textContent = ticketText();
    const t = total();
    $('[data-sum-total]').textContent = t === 0 ? 'Free' : `${t} MAD`;
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
    $('span', nextBtn).textContent = n === 3 ? `Confirm · ${total() === 0 ? 'Free' : total() + ' MAD'}` : 'Continue';
    updateSummary();
    if (n === 1) { const b = $('.cal__day[tabindex="0"]', calEl); if (b && prev !== 1) b.focus(); }
    if (n === 2) $('[data-inc]', stepsEls[2]).focus();
    if (n === 3) $('#t-name').focus();
    if (n === 'done') cur.focus();
    live.textContent = n === 'done' ? 'Booking confirmed.' : `Step ${n} of 3.`;
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
      err.textContent = emailOk ? '' : 'Please enter a valid email address, e.g. name@example.com.';
      if (!nameOk) { name.focus(); return; }
      if (!emailOk) { email.focus(); return; }
      const ref = 'BAM-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      state.ref = ref;
      $('[data-done-date]').textContent = `${fmtLong.format(state.date)} at ${state.slot}`;
      $('[data-done-ref]').textContent = ref;
      $('[data-done-email]').textContent = email.value.trim();
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
      'SUMMARY:Visit — Musées de Bank Al-Maghrib', `DESCRIPTION:Booking ${state.ref} · ${ticketText()}`,
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
      eventsLive.textContent = `${n} event${n === 1 ? '' : 's'} shown.`;
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
    newsMsg.textContent = ok ? 'Thank you — the first letter arrives next month.' : 'Please enter a valid email address.';
    if (ok) news.reset(); else input.focus();
  });

  applyMotion();
})();
