
/* Runtime: picks up the language chosen before first paint (see the inline
   script in <head>), translates every [data-i18n] element and
   [data-i18n-attr] attribute, and tells app.js when the language changes. */
(function () {
  'use strict';
  var S = window.BAM_STRINGS;
  var LANGS = ['fr', 'ar', 'en', 'es'];
  var LOCALE = { fr: 'fr-FR', ar: 'ar-MA-u-nu-latn', en: 'en-GB', es: 'es-ES' };
  var I = { lang: LANGS.indexOf(window.BAM_LANG) > -1 ? window.BAM_LANG : 'fr', langs: LANGS, listeners: [] };

  I.locale = function () { return LOCALE[I.lang]; };
  I.t = function (key, vars) {
    var v = S[I.lang] && S[I.lang][key];
    if (v == null) v = S.en[key];
    if (v == null) return key;
    if (vars) v = v.replace(/\{(\w+)\}/g, function (m, n) { return vars[n] != null ? vars[n] : m; });
    return v;
  };
  I.plural = function (key, n, vars) {
    var form = 'other';
    try { form = new Intl.PluralRules(I.locale()).select(n) === 'one' ? 'one' : 'other'; } catch (e) { form = n === 1 ? 'one' : 'other'; }
    vars = vars || {}; vars.n = n;
    return I.t(key + '.' + form, vars);
  };
  // Content fields may be plain strings or { fr, ar, en, es } objects.
  I.L = function (v) {
    if (v == null) return '';
    if (typeof v !== 'object') return String(v);
    return v[I.lang] || v.fr || v.en || '';
  };
  I.applyStatic = function () {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-i18n'), v = I.t(k);
      if (v !== k) els[i].innerHTML = v;
    }
    var at = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < at.length; j++) {
      at[j].getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var c = pair.indexOf(':');
        if (c > 0) at[j].setAttribute(pair.slice(0, c), I.t(pair.slice(c + 1)));
      });
    }
    document.title = I.t('meta.title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', I.t('meta.desc'));
  };
  I.set = function (lang, opts) {
    if (LANGS.indexOf(lang) < 0) lang = 'fr';
    I.lang = lang;
    var d = document.documentElement;
    d.lang = lang;
    d.dir = lang === 'ar' ? 'rtl' : 'ltr';
    I.applyStatic();
    if (opts && opts.save) {
      try { localStorage.setItem('bam-lang', lang); } catch (e) { /* storage unavailable */ }
      try {
        var u = new URL(location.href);
        u.searchParams.set('lang', lang);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) { /* ignore */ }
    }
    I.listeners.forEach(function (f) { f(lang); });
    d.classList.remove('i18n-pending');
  };
  I.onChange = function (f) { I.listeners.push(f); };
  window.BAM_I18N = I;
  I.set(I.lang);
})();
