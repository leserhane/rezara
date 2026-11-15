/* ParaNajouaStep — cart, shop filters, WhatsApp checkout. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var LANG = (doc.lang || 'fr').slice(0, 2) === 'ar' ? 'ar' : 'fr';
  var ROOT = doc.getAttribute('data-root') || './';
  var CAT = window.PNS_CATALOG || {};
  var SHIP = window.PNS_SHIPPING || [];
  var WA = window.PNS_WHATSAPP || '';
  var KEY = 'pns_cart_v1';

  var S = {
    fr: {
      added: 'Ajouté au panier', view: 'Voir le panier', cur: 'DH', free: 'Offerte', remove: 'Retirer',
      freeHint: function (n) { return 'Plus que ' + n + ' DH pour la livraison offerte.'; },
      freeOk: 'Livraison offerte 🎉', unit: 'l’unité',
      msgHead: 'Bonjour ParaNajouaStep, voici ma commande', ref: 'Réf.', items: 'Produits', sub: 'Sous-total',
      ship: 'Livraison', total: 'Total', name: 'Nom', phone: 'Téléphone', city: 'Ville', addr: 'Adresse', note: 'Remarque',
      pay: 'Paiement à la livraison', order: 'Commande', err: 'Merci de compléter les champs obligatoires.'
    },
    ar: {
      added: 'تمت الإضافة إلى السلة', view: 'عرض السلة', cur: 'درهم', free: 'مجاني', remove: 'حذف',
      freeHint: function (n) { return 'باقي ' + n + ' درهم للتوصيل المجاني.'; },
      freeOk: 'التوصيل مجاني 🎉', unit: 'للوحدة',
      msgHead: 'السلام عليكم ParaNajouaStep، هذه طلبيتي', ref: 'المرجع', items: 'المنتجات', sub: 'المجموع الفرعي',
      ship: 'التوصيل', total: 'المجموع', name: 'الاسم', phone: 'الهاتف', city: 'المدينة', addr: 'العنوان', note: 'ملاحظة',
      pay: 'الدفع عند الاستلام', order: 'طلبية', err: 'المرجو ملء الخانات الإجبارية.'
    }
  }[LANG];

  function money(v) { return v + ' ' + S.cur; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------------------------------------------------------------- storage
  var memory = {};
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return memory; }
  }
  function save(cart) {
    memory = cart;
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode: keep in memory */ }
    renderCount(true);
  }
  function clean(cart) {
    Object.keys(cart).forEach(function (k) { if (!CAT[k] || !(cart[k] > 0)) delete cart[k]; });
    return cart;
  }
  function add(slug, qty) {
    var cart = clean(load());
    cart[slug] = Math.min(20, (cart[slug] || 0) + (qty || 1));
    save(cart);
  }
  function countItems(cart) { return Object.keys(cart).reduce(function (n, k) { return n + cart[k]; }, 0); }

  function renderCount(bump) {
    var n = countItems(clean(load()));
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = n; el.hidden = n === 0;
      if (bump && n) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
  }

  // ---------------------------------------------------------------- toast
  var toastTimer;
  function toast(name) {
    var el = document.querySelector('.toast');
    if (!el) return;
    el.innerHTML = '<span>✓ ' + esc(S.added) + (name ? ' — ' + esc(name) : '') + '</span><a href="' + ROOT + (LANG === 'ar' ? 'ar/' : '') + 'panier/">' + esc(S.view) + '</a>';
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3800);
  }

  // ---------------------------------------------------------------- add buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var slug = btn.getAttribute('data-add');
    if (!CAT[slug]) return;
    var qty = 1;
    if (btn.hasAttribute('data-with-qty')) {
      var inp = document.querySelector('[data-qty] input');
      qty = Math.max(1, Math.min(20, parseInt(inp && inp.value, 10) || 1));
    }
    add(slug, qty);
    btn.classList.add('added');
    setTimeout(function () { btn.classList.remove('added'); }, 1200);
    toast(CAT[slug][LANG]);
  });

  // product page quantity stepper
  var qtyBox = document.querySelector('[data-qty]');
  if (qtyBox) {
    var qi = qtyBox.querySelector('input');
    qtyBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]');
      if (!b) return;
      qi.value = Math.max(1, Math.min(20, (parseInt(qi.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10)));
    });
  }

  // ---------------------------------------------------------------- shop filters
  var shop = document.querySelector('[data-shop]');
  if (shop) {
    var gridEl = shop.querySelector('.grid');
    var cards = Array.prototype.slice.call(gridEl.querySelectorAll('.card'));
    cards.forEach(function (c, i) { c.dataset.i = i; });
    var chips = shop.querySelectorAll('[data-filter]');
    var sortSel = shop.querySelector('[data-sort]');
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get('cat') || '', q: (params.get('q') || '').trim().toLowerCase() };
    var qInput = document.getElementById('q');
    if (qInput && state.q) qInput.value = params.get('q');

    function norm(s) { return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s; }
    function apply() {
      var shown = 0, words = norm(state.q).split(/\s+/).filter(Boolean);
      cards.forEach(function (c) {
        var okCat = !state.cat || (' ' + c.dataset.cats + ' ').indexOf(' ' + state.cat + ' ') > -1;
        var hay = norm(c.dataset.search);
        var okQ = words.every(function (w) { return hay.indexOf(w) > -1; });
        c.hidden = !(okCat && okQ);
        if (!c.hidden) shown++;
      });
      var cnt = shop.querySelector('[data-count]'); if (cnt) cnt.textContent = shown;
      var empty = shop.querySelector('[data-empty]'); if (empty) empty.hidden = shown > 0;
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.getAttribute('data-filter') === state.cat)); });
    }
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        state.cat = ch.getAttribute('data-filter');
        var u = new URL(location.href);
        if (state.cat) u.searchParams.set('cat', state.cat); else u.searchParams.delete('cat');
        history.replaceState(null, '', u);
        apply();
      });
    });
    if (sortSel) sortSel.addEventListener('change', function () {
      var v = sortSel.value;
      cards.slice().sort(function (a, b) {
        if (v === 'asc') return a.dataset.price - b.dataset.price;
        if (v === 'desc') return b.dataset.price - a.dataset.price;
        return a.dataset.i - b.dataset.i;
      }).forEach(function (c) { gridEl.appendChild(c); });
    });
    apply();
  }

  // ---------------------------------------------------------------- cart page
  var page = document.querySelector('[data-cart-page]');
  if (page) {
    var linesEl = page.querySelector('[data-cart-lines]');
    var citySel = page.querySelector('[data-city]');
    var form = page.querySelector('[data-checkout]');
    var addrField = page.querySelector('[data-addr-field]');
    try { var last = localStorage.getItem('pns_city'); if (last && citySel.querySelector('option[value="' + last + '"]')) citySel.value = last; } catch (e) {}

    function shipFor(sub) {
      var s = SHIP.filter(function (x) { return x.k === citySel.value; })[0] || SHIP[0];
      var fee = (s.fee === 0 || sub >= s.free) ? 0 : s.fee;
      return { s: s, fee: fee };
    }
    function totals(cart) {
      var sub = Object.keys(cart).reduce(function (t, k) { return t + CAT[k].p * cart[k]; }, 0);
      var sh = shipFor(sub);
      return { sub: sub, fee: sh.fee, s: sh.s, total: sub + sh.fee };
    }

    function render() {
      var cart = clean(load());
      var keys = Object.keys(cart);
      page.querySelector('[data-cart-empty]').hidden = keys.length > 0;
      page.querySelector('[data-cart-full]').hidden = keys.length === 0;
      if (!keys.length) return;
      linesEl.innerHTML = keys.map(function (k) {
        var p = CAT[k], url = ROOT + (LANG === 'ar' ? 'ar/' : '') + 'produit/' + k + '/';
        return '<li class="cart-line">' +
          '<a href="' + url + '"><img src="' + ROOT + 'assets/img/products/' + k + '.webp" width="76" height="76" alt=""></a>' +
          '<div><a href="' + url + '">' + esc(p[LANG]) + '</a><div class="unit">' + money(p.p) + ' ' + esc(S.unit) + (p.s ? ' · ' + esc(p.s) : '') + '</div></div>' +
          '<div class="line-end"><div class="qty"><button type="button" data-line="' + k + '" data-d="-1" aria-label="-">−</button><span>' + cart[k] + '</span><button type="button" data-line="' + k + '" data-d="1" aria-label="+">+</button></div>' +
          '<strong>' + money(p.p * cart[k]) + '</strong><button type="button" class="remove" data-remove="' + k + '">' + esc(S.remove) + '</button></div></li>';
      }).join('');
      var t = totals(cart);
      page.querySelector('[data-sub]').textContent = money(t.sub);
      page.querySelector('[data-ship]').textContent = t.fee === 0 ? S.free : money(t.fee);
      page.querySelector('[data-total]').textContent = money(t.total);
      var hint = page.querySelector('[data-free-hint]');
      if (t.s.fee === 0) hint.textContent = '';
      else hint.textContent = t.fee === 0 ? S.freeOk : S.freeHint(t.s.free - t.sub);
      addrField.hidden = citySel.value === 'retrait';
      addrField.querySelector('input').required = citySel.value !== 'retrait';
    }

    linesEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-line],[data-remove]');
      if (!b) return;
      var cart = clean(load());
      if (b.hasAttribute('data-remove')) delete cart[b.getAttribute('data-remove')];
      else {
        var k = b.getAttribute('data-line');
        cart[k] = Math.max(0, Math.min(20, (cart[k] || 0) + parseInt(b.getAttribute('data-d'), 10)));
      }
      save(cart); render();
    });
    citySel.addEventListener('change', function () {
      try { localStorage.setItem('pns_city', citySel.value); } catch (e) {}
      render();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (inp) {
        var bad = !inp.value.trim() || (inp.type === 'tel' && inp.value.replace(/\D/g, '').length < 9);
        inp.closest('.field').classList.toggle('invalid', bad);
        if (bad && ok) { inp.focus(); ok = false; }
      });
      if (!ok) { toastMsg(S.err); return; }
      var cart = clean(load());
      var t = totals(cart);
      var d = new Date();
      var ref = 'PNS-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      var f = new FormData(form);
      var lines = Object.keys(cart).map(function (k) { return '• ' + cart[k] + ' × ' + CAT[k][LANG] + (CAT[k].s ? ' (' + CAT[k].s + ')' : '') + ' — ' + money(CAT[k].p * cart[k]); });
      var msg = [
        S.msgHead + ' 🌿', S.ref + ' ' + ref, '',
        S.items + ' :', lines.join('\n'), '',
        S.sub + ' : ' + money(t.sub),
        S.ship + ' (' + t.s[LANG] + ') : ' + (t.fee === 0 ? S.free : money(t.fee)),
        S.total + ' : ' + money(t.total), '',
        S.name + ' : ' + f.get('name'),
        S.phone + ' : ' + f.get('phone'),
        S.city + ' : ' + t.s[LANG],
        citySel.value !== 'retrait' ? S.addr + ' : ' + f.get('address') : '',
        f.get('note') ? S.note + ' : ' + f.get('note') : '',
        S.pay
      ].filter(function (x, i, a) { return x !== '' || (a[i - 1] !== ''); }).join('\n');
      var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener');
      save({});
      page.querySelector('[data-cart-full]').hidden = true;
      var done = page.querySelector('[data-cart-done]');
      done.hidden = false;
      done.querySelector('[data-order-ref]').textContent = S.order + ' ' + ref + ' · ' + money(t.total);
      done.querySelector('[data-wa-again]').href = url;
      window.scrollTo({ top: 0 });
    });
    form.addEventListener('input', function (e) { var fl = e.target.closest('.field'); if (fl) fl.classList.remove('invalid'); });

    function toastMsg(m) {
      var el = document.querySelector('.toast'); if (!el) return;
      el.textContent = m; el.hidden = false; clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.hidden = true; }, 3500);
    }
    render();
  }

  // ---------------------------------------------------------------- lazy autoplay brand video
  var vid = document.querySelector('video[data-autoplay]');
  if (vid && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { vid.preload = 'auto'; var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else vid.pause();
      });
    }, { threshold: .4 }).observe(vid);
  }

  renderCount(false);
  window.addEventListener('storage', function (e) { if (e.key === KEY) renderCount(false); });
})();
