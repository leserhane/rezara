# -*- coding: utf-8 -*-
"""Static site generator for the ParaNajouaStep online shop (FR + AR).

    python3 _src/build.py

Writes every HTML page, sitemap.xml, robots.txt, site.webmanifest and
assets/js/catalog.js next to this folder. Pages link to each other with
relative paths, so the output works at a domain root or in a sub-folder.
"""
import os, json, html, datetime, shutil
from data import STORE, SHIPPING, CATEGORIES, PRODUCTS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, '..'))
SITE = STORE['site_url'].rstrip('/')
TODAY = datetime.date.today().isoformat()
ASSET_V = datetime.datetime.now().strftime('%Y%m%d%H%M')
E = html.escape

CAT = {c['slug']: c for c in CATEGORIES}
PROD = {p['slug']: p for p in PRODUCTS}
for p in PRODUCTS:
    p['cats'] = [p['cat']] + p.get('cats_extra', [])

SITEMAP = []  # (path) — FR path; AR is 'ar/' + path

# ------------------------------------------------------------------ UI strings
T = {
    'fr': {
        'tagline': 'Santé · Beauté · Bien-être',
        'slogan': 'Prenez soin de vous',
        'topbar': 'Livraison à Kénitra, Rabat, Salé & Témara · Paiement à la livraison',
        'home': 'Accueil', 'shop': 'Boutique', 'all': 'Tous les produits', 'contact': 'Contact',
        'kenitra': 'Parapharmacie Kénitra', 'rabat': 'Livraison Rabat',
        'search_ph': 'Rechercher un produit, une marque…', 'search': 'Rechercher',
        'cart': 'Panier', 'add': 'Ajouter', 'add_long': 'Ajouter au panier', 'currency': 'DH',
        'order_wa': 'Commander sur WhatsApp', 'see': 'Voir le produit',
        'other_lang': 'العربية', 'other_lang_code': 'ar',
        'in_stock': 'En stock', 'size': 'Contenance', 'brand': 'Marque',
        'desc': 'Description', 'benefits': 'Bienfaits', 'usage': 'Conseils d’utilisation',
        'related': 'Vous aimerez aussi', 'qty': 'Quantité',
        'trust': [
            ('Produits 100 % authentiques', 'Circuit officiel, dates contrôlées'),
            ('Conseil personnalisé', 'Une parapharmacienne à votre écoute'),
            ('Livraison rapide', 'Kénitra le jour même · Rabat en 24h'),
            ('Paiement à la livraison', 'Vous payez en recevant votre colis'),
        ],
        'footer_about': "ParaNajouaStep est une parapharmacie à Kénitra spécialisée en dermo-cosmétique, soins du visage, "
                        "du corps et des cheveux. Commandez en ligne et faites-vous livrer à Kénitra, Rabat, Salé, Témara et partout au Maroc.",
        'footer_cats': 'Catégories', 'footer_info': 'Informations', 'footer_visit': 'Nous trouver',
        'hours': 'Horaires', 'cities_served': 'Villes livrées',
        'rights': 'Tous droits réservés.',
        'delivery_box': 'Livraison', 'payment_box': 'Paiement à la livraison, ou retrait gratuit en boutique à Kénitra.',
        'free_from': 'offerte dès', 'pickup': 'Retrait en boutique',
        'breadcrumb': 'Fil d’Ariane', 'products_n': 'produits',
        'sort': 'Trier', 'sort_pop': 'Sélection', 'sort_asc': 'Prix croissant', 'sort_desc': 'Prix décroissant',
        'no_result': 'Aucun produit ne correspond à votre recherche.',
        'whatsapp_q': 'Une question ? Écrivez-nous sur WhatsApp',
    },
    'ar': {
        'tagline': 'صحة · جمال · رفاهية',
        'slogan': 'اعتنِ بنفسك',
        'topbar': 'التوصيل إلى القنيطرة والرباط وسلا وتمارة · الدفع عند الاستلام',
        'home': 'الرئيسية', 'shop': 'المتجر', 'all': 'جميع المنتجات', 'contact': 'اتصل بنا',
        'kenitra': 'بارافارماسي القنيطرة', 'rabat': 'التوصيل إلى الرباط',
        'search_ph': 'ابحث عن منتج أو ماركة…', 'search': 'بحث',
        'cart': 'السلة', 'add': 'أضف', 'add_long': 'أضف إلى السلة', 'currency': 'درهم',
        'order_wa': 'اطلب عبر واتساب', 'see': 'عرض المنتج',
        'other_lang': 'Français', 'other_lang_code': 'fr',
        'in_stock': 'متوفر', 'size': 'الحجم', 'brand': 'الماركة',
        'desc': 'الوصف', 'benefits': 'الفوائد', 'usage': 'طريقة الاستعمال',
        'related': 'قد يعجبك أيضاً', 'qty': 'الكمية',
        'trust': [
            ('منتجات أصلية 100%', 'من الموزعين الرسميين وتواريخ مراقبة'),
            ('نصائح مختصة', 'مختصة في البارافارماسي رهن إشارتكم'),
            ('توصيل سريع', 'القنيطرة في نفس اليوم · الرباط خلال 24 ساعة'),
            ('الدفع عند الاستلام', 'تدفع عندما تتوصل بطلبيتك'),
        ],
        'footer_about': 'ParaNajouaStep بارافارماسي في القنيطرة متخصص في منتجات التجميل الجلدي والعناية بالوجه والجسم والشعر. '
                        'اطلب أونلاين وتوصل بطلبيتك في القنيطرة والرباط وسلا وتمارة وفي جميع مدن المغرب.',
        'footer_cats': 'الأقسام', 'footer_info': 'معلومات', 'footer_visit': 'عنواننا',
        'hours': 'أوقات العمل', 'cities_served': 'المدن التي نوصل إليها',
        'rights': 'جميع الحقوق محفوظة.',
        'delivery_box': 'التوصيل', 'payment_box': 'الدفع عند الاستلام، أو الاستلام مجاناً من المحل في القنيطرة.',
        'free_from': 'مجاني ابتداءً من', 'pickup': 'الاستلام من المحل',
        'breadcrumb': 'مسار التصفح', 'products_n': 'منتج',
        'sort': 'ترتيب', 'sort_pop': 'اختيارنا', 'sort_asc': 'الثمن تصاعدياً', 'sort_desc': 'الثمن تنازلياً',
        'no_result': 'لا يوجد منتج يطابق بحثك.',
        'whatsapp_q': 'عندك سؤال؟ راسلنا على واتساب',
    },
}


def price(lang, v):
    return f"{v} {T[lang]['currency']}"


# ------------------------------------------------------------------ helpers
class Ctx:
    """Per-page link helper: knows the page's depth so links stay relative."""

    def __init__(self, lang, path):
        self.lang, self.path = lang, path
        full = ('ar/' if lang == 'ar' else '') + path
        depth = full.count('/')
        self.root = '../' * depth if depth else './'
        self.t = T[lang]

    def href(self, path, lang=None):
        lang = lang or self.lang
        return self.root + ('ar/' if lang == 'ar' else '') + path

    def asset(self, p):
        return self.root + 'assets/' + p

    def abs(self, path, lang=None):
        lang = lang or self.lang
        return SITE + '/' + ('ar/' if lang == 'ar' else '') + path


def img_abs(p):
    return SITE + '/assets/img/' + p


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'


def store_ld(lang):
    days = {'Mo': 'Monday', 'Tu': 'Tuesday', 'We': 'Wednesday', 'Th': 'Thursday', 'Fr': 'Friday', 'Sa': 'Saturday', 'Su': 'Sunday'}
    order = list(days)
    specs = []
    for rng, o, c in STORE['hours']:
        if '-' in rng:
            a, b = rng.split('-'); ds = order[order.index(a):order.index(b) + 1]
        else:
            ds = [rng]
        specs.append({'@type': 'OpeningHoursSpecification', 'dayOfWeek': [days[d] for d in ds], 'opens': o, 'closes': c})
    cities = ['Kénitra', 'Rabat', 'Salé', 'Témara', 'Sidi Kacem', 'Sidi Slimane', 'Mehdia']
    return {
        '@context': 'https://schema.org',
        '@type': ['Store', 'HealthAndBeautyBusiness'],
        '@id': SITE + '/#store',
        'name': STORE['name'],
        'alternateName': ['ParaNajouaStep Kénitra', 'Parapharmacie Najoua Step', 'بارافارماسي نجوى ستيب'],
        'description': T[lang]['footer_about'],
        'url': SITE + '/',
        'logo': img_abs('logo-mark-512.png'),
        'image': [img_abs('og-image.jpg'), img_abs('logo-full.png')],
        'telephone': STORE['phone_tel'],
        'email': STORE['email'],
        'priceRange': '69 – 279 MAD',
        'currenciesAccepted': 'MAD',
        'paymentAccepted': 'Cash, Paiement à la livraison',
        'address': {
            '@type': 'PostalAddress', 'streetAddress': STORE['street_fr'], 'addressLocality': STORE['city'],
            'postalCode': STORE['postal_code'], 'addressRegion': STORE['region'], 'addressCountry': 'MA'},
        'geo': {'@type': 'GeoCoordinates', 'latitude': STORE['lat'], 'longitude': STORE['lng']},
        'hasMap': f"https://www.google.com/maps/search/?api=1&query={STORE['lat']},{STORE['lng']}",
        'openingHoursSpecification': specs,
        'areaServed': [{'@type': 'City', 'name': c} for c in cities],
        'sameAs': [STORE['instagram'], STORE['facebook']],
        'contactPoint': {'@type': 'ContactPoint', 'telephone': STORE['phone_tel'], 'contactType': 'customer service',
                         'availableLanguage': ['French', 'Arabic'], 'areaServed': 'MA'},
    }


def website_ld(c):
    return {
        '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website',
        'url': c.abs(''), 'name': STORE['name'], 'inLanguage': 'ar-MA' if c.lang == 'ar' else 'fr-MA',
        'publisher': {'@id': SITE + '/#store'},
        'potentialAction': {'@type': 'SearchAction',
                            'target': {'@type': 'EntryPoint', 'urlTemplate': c.abs('boutique/') + '?q={search_term_string}'},
                            'query-input': 'required name=search_term_string'},
    }


def crumbs_ld(c, items):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': c.abs(p)} for i, (n, p) in enumerate(items)]}


def faq_ld(faqs):
    return {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faqs]}


def crumbs_html(c, items):
    lis = []
    for i, (n, p) in enumerate(items):
        if i == len(items) - 1:
            lis.append(f'<li aria-current="page">{E(n)}</li>')
        else:
            lis.append(f'<li><a href="{c.href(p)}">{E(n)}</a></li>')
    return f'<nav class="crumbs" aria-label="{E(c.t["breadcrumb"])}"><ol>{"".join(lis)}</ol></nav>'


def faq_html(faqs, title):
    items = ''.join(f'<details class="faq-item"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in faqs)
    return f'<section class="section faq" id="faq"><div class="wrap narrow"><h2 class="h2">{E(title)}</h2>{items}</div></section>'


# ------------------------------------------------------------------ icons
ICON = {
    'cart': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.6L5 3H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="20" r="1.4" fill="currentColor"/><circle cx="17.5" cy="20" r="1.4" fill="currentColor"/></svg>',
    'search': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    'wa': '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>',
    'pin': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    'phone': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    'clock': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    'check': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'leaf': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'truck': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="1.8" fill="var(--bg)" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="17.5" r="1.8" fill="var(--bg)" stroke="currentColor" stroke-width="1.8"/></svg>',
    'cash': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    'chat': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
}
TRUST_ICONS = ['check', 'chat', 'truck', 'cash']


# ------------------------------------------------------------------ layout
def layout(c, *, title, desc, body, jsonld=(), noindex=False, page_class='', og_image=None, og_type='website'):
    t = c.t
    lang = c.lang
    other = 'fr' if lang == 'ar' else 'ar'
    canonical = c.abs(c.path)
    hreflang = (f'<link rel="alternate" hreflang="fr-MA" href="{c.abs(c.path, "fr")}">'
                f'<link rel="alternate" hreflang="ar-MA" href="{c.abs(c.path, "ar")}">'
                f'<link rel="alternate" hreflang="x-default" href="{c.abs(c.path, "fr")}">')
    if lang == 'ar':
        fonts = 'family=Cormorant+Garamond:wght@600;700&family=Tajawal:wght@400;500;700;800'
    else:
        fonts = 'family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@400;500;600'
    og_image = og_image or img_abs('og-image.jpg')
    robots = 'noindex, follow' if noindex else 'index, follow, max-image-preview:large'

    cat_links = ''.join(f'<li><a href="{c.href("categorie/" + k["slug"] + "/")}"{" aria-current=page" if c.path == "categorie/" + k["slug"] + "/" else ""}>{E(k[lang])}</a></li>' for k in CATEGORIES)
    nav = (f'<li><a href="{c.href("boutique/")}"{" aria-current=page" if c.path == "boutique/" else ""}>{E(t["all"])}</a></li>{cat_links}'
           f'<li class="nav-city"><a href="{c.href("parapharmacie-kenitra/")}">{E(t["kenitra"])}</a></li>'
           f'<li class="nav-city"><a href="{c.href("parapharmacie-rabat/")}">{E(t["rabat"])}</a></li>'
           f'<li><a href="{c.href("contact/")}">{E(t["contact"])}</a></li>')

    wa_link = f"https://wa.me/{STORE['whatsapp']}"
    year = datetime.date.today().year
    ship_rows = ''.join(f'<li>{E(s[1] if lang == "fr" else s[2])}</li>' for s in SHIPPING if s[0] not in ('autre', 'retrait'))

    head = f'''<!doctype html>
<html lang="{'ar-MA' if lang == 'ar' else 'fr-MA'}" dir="{'rtl' if lang == 'ar' else 'ltr'}" data-root="{c.root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{canonical}">
{hreflang}
<meta name="theme-color" content="#4f5d38">
<meta name="geo.region" content="MA-KEN">
<meta name="geo.placename" content="Kénitra">
<meta name="geo.position" content="{STORE['lat']};{STORE['lng']}">
<meta name="ICBM" content="{STORE['lat']}, {STORE['lng']}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{STORE['name']}">
<meta property="og:locale" content="{'ar_MA' if lang == 'ar' else 'fr_MA'}">
<meta property="og:locale:alternate" content="{'fr_MA' if lang == 'ar' else 'ar_MA'}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og_image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{c.asset('img/icon-32.png')}" sizes="32x32">
<link rel="apple-touch-icon" href="{c.asset('img/icon-180.png')}">
<link rel="manifest" href="{c.root}site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<link rel="stylesheet" href="{c.asset('css/style.css')}?v={ASSET_V}">
{''.join(ld(j) for j in jsonld)}
</head>'''

    header = f'''<body class="{page_class}">
<a class="skip" href="#main">{'تخطي إلى المحتوى' if lang == 'ar' else 'Aller au contenu'}</a>
<div class="topbar"><div class="wrap topbar-in"><p>{E(t['topbar'])}</p><a href="tel:{STORE['phone_tel']}" class="topbar-tel" dir="ltr">{ICON['phone']}{E(STORE['phone_display'])}</a></div></div>
<header class="header">
  <div class="wrap header-in">
    <a class="logo" href="{c.href('')}" aria-label="{STORE['name']} – {E(t['home'])}">
      <img src="{c.asset('img/logo-mark.png')}" width="56" height="56" alt="">
      <span class="wm" dir="ltr"><span class="wm-name"><span class="wm-a">Para</span><span class="wm-b">NajouaStep</span></span><span class="wm-tag" dir="auto">{E(t['tagline'])}</span></span>
    </a>
    <form class="search" role="search" action="{c.href('boutique/')}" method="get">
      <label class="sr" for="q">{E(t['search'])}</label>
      <input id="q" name="q" type="search" placeholder="{E(t['search_ph'])}" autocomplete="off">
      <button type="submit" aria-label="{E(t['search'])}">{ICON['search']}</button>
    </form>
    <div class="header-actions">
      <a class="lang" href="{c.href(c.path, other)}" hreflang="{other}" lang="{other}">{E(t['other_lang'])}</a>
      <a class="cart-btn" href="{c.href('panier/')}" aria-label="{E(t['cart'])}">{ICON['cart']}<span class="cart-label">{E(t['cart'])}</span><span class="cart-count" data-cart-count hidden>0</span></a>
    </div>
  </div>
  <nav class="catnav" aria-label="{E(t['shop'])}"><ul class="wrap">{nav}</ul></nav>
</header>
<main id="main">'''

    footer = f'''</main>
<footer class="footer">
  <div class="wrap footer-grid">
    <div class="f-brand">
      <img src="{c.asset('img/logo-full.png')}" width="160" height="158" alt="{STORE['name']} – {E(t['tagline'])}" loading="lazy">
      <p>{E(t['footer_about'])}</p>
    </div>
    <div>
      <h2 class="f-h">{E(t['footer_cats'])}</h2>
      <ul class="f-list">{cat_links}</ul>
    </div>
    <div>
      <h2 class="f-h">{E(t['footer_info'])}</h2>
      <ul class="f-list">
        <li><a href="{c.href('parapharmacie-kenitra/')}">{E(t['kenitra'])}</a></li>
        <li><a href="{c.href('parapharmacie-rabat/')}">{E(t['rabat'])}</a></li>
        <li><a href="{c.href('livraison/')}">{'التوصيل والدفع' if lang == 'ar' else 'Livraison & paiement'}</a></li>
        <li><a href="{c.href('contact/')}">{E(t['contact'])}</a></li>
        <li><a href="{c.href(c.path, other)}" lang="{other}">{E(t['other_lang'])}</a></li>
      </ul>
      <h2 class="f-h">{E(t['cities_served'])}</h2>
      <ul class="f-cities">{ship_rows}</ul>
    </div>
    <div>
      <h2 class="f-h">{E(t['footer_visit'])}</h2>
      <address class="f-addr">
        <p>{ICON['pin']}<span>{E(STORE['street_fr'] if lang == 'fr' else STORE['street_ar'])}<br>{'القنيطرة' if lang == 'ar' else STORE['city']} {STORE['postal_code']}, {'المغرب' if lang == 'ar' else 'Maroc'}</span></p>
        <p>{ICON['phone']}<a href="tel:{STORE['phone_tel']}" dir="ltr">{E(STORE['phone_display'])}</a></p>
        <p>{ICON['wa']}<a href="{wa_link}" rel="noopener" target="_blank">WhatsApp</a></p>
        <p>{ICON['clock']}<span>{E(STORE['hours_fr'] if lang == 'fr' else STORE['hours_ar'])}</span></p>
      </address>
    </div>
  </div>
  <div class="wrap f-bottom"><p>© {year} {STORE['name']} · {'بارافارماسي القنيطرة' if lang == 'ar' else 'Parapharmacie à Kénitra'} · {E(t['rights'])}</p><p class="f-slogan">{E(t['slogan'])}</p></div>
</footer>
<a class="wa-float" href="{wa_link}" target="_blank" rel="noopener" aria-label="{E(t['whatsapp_q'])}">{ICON['wa']}</a>
<div class="toast" role="status" aria-live="polite" hidden></div>
<script src="{c.asset('js/catalog.js')}?v={ASSET_V}"></script>
<script src="{c.asset('js/app.js')}?v={ASSET_V}"></script>
</body>
</html>
'''
    return head + header + body + footer


def write(c, content, sitemap=True):
    full = ('ar/' if c.lang == 'ar' else '') + c.path
    d = os.path.join(OUT, full)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(content)
    if sitemap and c.lang == 'fr':
        SITEMAP.append(c.path)


# ------------------------------------------------------------------ components
def card(c, p, eager=False):
    lang = c.lang
    url = c.href('produit/' + p['slug'] + '/')
    search = ' '.join([p['brand'], p['fr'], p['ar'], CAT[p['cat']]['fr'], CAT[p['cat']]['ar']]).lower()
    size = f'<span class="size" dir="ltr">{E(p["size"])}</span>' if p['size'] else ''
    return f'''<article class="card" data-slug="{p['slug']}" data-cats="{' '.join(p['cats'])}" data-price="{p['price']}" data-search="{E(search)}">
  <a class="card-img" href="{url}" tabindex="-1" aria-hidden="true"><img src="{c.asset('img/products/' + p['slug'] + '.webp')}" width="640" height="640" alt="{E(p[lang])}" loading="{'eager' if eager else 'lazy'}" decoding="async"></a>
  <div class="card-body">
    <p class="card-brand">{E(p['brand'])}</p>
    <h3 class="card-title"><a href="{url}">{E(p[lang])}</a></h3>
    <div class="card-foot"><p class="price">{price(lang, p['price'])}{size}</p>
    <button class="btn-add" type="button" data-add="{p['slug']}" aria-label="{E(c.t['add_long'])} – {E(p[lang])}">{ICON['cart']}<span>{E(c.t['add'])}</span></button></div>
  </div>
</article>'''


def grid(c, prods, eager_n=0):
    return '<div class="grid">' + ''.join(card(c, p, i < eager_n) for i, p in enumerate(prods)) + '</div>'


def trust(c):
    items = ''.join(f'<li>{ICON[i]}<div><strong>{E(a)}</strong><span>{E(b)}</span></div></li>' for i, (a, b) in zip(TRUST_ICONS, c.t['trust']))
    return f'<section class="trust" aria-label="{"لماذا نحن" if c.lang == "ar" else "Nos engagements"}"><ul class="wrap">{items}</ul></section>'


def shipping_table(c):
    lang = c.lang
    head = ('<tr><th>المدينة</th><th>ثمن التوصيل</th><th>مجاني ابتداءً من</th><th>المدة</th></tr>' if lang == 'ar'
            else '<tr><th>Ville</th><th>Frais</th><th>Offerte dès</th><th>Délai</th></tr>')
    rows = ''
    for key, fr, ar, fee, free, dfr, dar in SHIPPING:
        fee_s = ('مجاني' if lang == 'ar' else 'Gratuit') if fee == 0 else price(lang, fee)
        free_s = '—' if fee == 0 else price(lang, free)
        rows += f'<tr><td>{E(fr if lang == "fr" else ar)}</td><td>{fee_s}</td><td>{free_s}</td><td>{E(dfr if lang == "fr" else dar)}</td></tr>'
    return f'<div class="table-wrap"><table class="ship-table"><thead>{head}</thead><tbody>{rows}</tbody></table></div>'


def map_embed(c):
    lat, lng = STORE['lat'], STORE['lng']
    bbox = f'{lng - 0.012},{lat - 0.008},{lng + 0.012},{lat + 0.008}'
    title = 'موقع ParaNajouaStep في القنيطرة' if c.lang == 'ar' else 'Plan d’accès ParaNajouaStep à Kénitra'
    return (f'<div class="map"><iframe title="{E(title)}" loading="lazy" referrerpolicy="no-referrer" '
            f'src="https://www.openstreetmap.org/export/embed.html?bbox={bbox}&amp;layer=mapnik&amp;marker={lat},{lng}"></iframe>'
            f'<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&amp;query={lat},{lng}">'
            f'{ICON["pin"]}{"افتح في خرائط Google" if c.lang == "ar" else "Ouvrir dans Google Maps"}</a></div>')


# ------------------------------------------------------------------ pages
FAQ_HOME = {
    'fr': [
        ("Où se trouve la parapharmacie ParaNajouaStep ?",
         f"Notre parapharmacie est située à Kénitra ({STORE['street_fr']}). Vous pouvez venir en boutique, commander en ligne pour un retrait gratuit, ou vous faire livrer à domicile."),
        ("Livrez-vous à Rabat, Salé et Témara ?",
         "Oui. Nous livrons Rabat, Salé et Témara sous 24h, et Kénitra le jour même pour toute commande passée avant 16h. Nous expédions aussi dans toutes les villes du Maroc."),
        ("Comment payer ma commande ?",
         "Vous payez en espèces à la livraison, à la réception de votre colis. Aucun paiement en ligne n'est demandé."),
        ("Vos produits sont-ils authentiques ?",
         "Tous nos produits (Avène, Bioderma, CeraVe, La Roche-Posay, Vichy, Uriage, ISDIN, SVR, Eucerin…) proviennent des circuits de distribution officiels au Maroc, avec des dates de péremption contrôlées."),
        ("Pouvez-vous me conseiller un soin adapté à ma peau ?",
         "Bien sûr. Écrivez-nous sur WhatsApp ou passez en boutique à Kénitra : nous vous orientons vers la routine adaptée à votre type de peau, à vos cheveux ou à ceux de vos enfants."),
    ],
    'ar': [
        ('أين يوجد بارافارماسي ParaNajouaStep؟',
         f"يوجد البارافارماسي ديالنا في القنيطرة ({STORE['street_ar']}). يمكنكم زيارة المحل، أو الطلب أونلاين والاستلام مجاناً من المحل، أو التوصيل إلى المنزل."),
        ('هل توصلون إلى الرباط وسلا وتمارة؟',
         'نعم. نوصل إلى الرباط وسلا وتمارة خلال 24 ساعة، وإلى القنيطرة في نفس اليوم لكل طلب قبل الساعة 16:00. كما نرسل الطلبيات إلى جميع مدن المغرب.'),
        ('كيف أدفع ثمن طلبيتي؟',
         'تدفع نقداً عند الاستلام، عندما تتوصل بطلبيتك. لا نطلب أي دفع أونلاين.'),
        ('هل منتجاتكم أصلية؟',
         'جميع منتجاتنا (Avène، Bioderma، CeraVe، La Roche-Posay، Vichy، Uriage، ISDIN، SVR، Eucerin…) من قنوات التوزيع الرسمية بالمغرب، مع مراقبة تواريخ الصلاحية.'),
        ('هل يمكنكم نصحي بمنتج يناسب بشرتي؟',
         'بكل تأكيد. راسلونا على واتساب أو زورونا في المحل بالقنيطرة، وسنقترح عليكم الروتين المناسب لنوع بشرتكم أو شعركم أو لأطفالكم.'),
    ],
}


def page_home(lang):
    c = Ctx(lang, '')
    t = c.t
    featured = [p for p in PRODUCTS if p.get('featured')]
    if lang == 'fr':
        title = 'Parapharmacie Kénitra & Rabat | ParaNajouaStep – Parapharmacie en ligne'
        desc = ("ParaNajouaStep, votre parapharmacie à Kénitra : Avène, Bioderma, CeraVe, La Roche-Posay, Vichy… "
                "Livraison rapide à Kénitra, Rabat, Salé et Témara. Paiement à la livraison.")
        h1 = 'Votre parapharmacie à Kénitra, livrée jusqu’à Rabat'
        lead = ("Les grandes marques dermo-cosmétiques — Avène, Bioderma, CeraVe, La Roche-Posay, Vichy, Uriage, ISDIN… — "
                "au juste prix et avec de vrais conseils. Livraison le jour même à Kénitra, en 24h à Rabat, Salé et Témara. "
                "Paiement à la livraison.")
        cta1, cta2 = 'Découvrir la boutique', 'Commander sur WhatsApp'
        cats_h, best_h = 'Nos univers', 'Les incontournables'
        about_h = 'Une parapharmacie de quartier, au cœur de Kénitra'
        about_p = [
            "Chez ParaNajouaStep, chaque produit est choisi avec soin pour répondre aux besoins réels de la peau : sensibilité, "
            "sécheresse, imperfections, taches, soleil, cuir chevelu. Notre équipe vous accueille en boutique à Kénitra et vous "
            "accompagne aussi à distance, par WhatsApp.",
            "Vous habitez Rabat, Salé, Témara, Sidi Kacem ou Sidi Slimane ? Commandez en ligne en quelques clics : nous préparons "
            "votre colis le jour même et vous payez simplement à la réception.",
        ]
        local_h = 'Parapharmacie à Kénitra et livraison à Rabat'
        local = [
            ('Kénitra', 'parapharmacie-kenitra/',
             "Retrait gratuit en boutique ou livraison le jour même dans tous les quartiers : centre-ville, Bir Rami, "
             "Les Mimosas, Val Fleuri, La Cigogne, Ouled Oujih, Saknia, Maamora et jusqu’à Mehdia."),
            ('Rabat · Salé · Témara', 'parapharmacie-rabat/',
             "Livraison en 24h à Agdal, Hay Riad, Souissi, Hassan, L’Océan, Yacoub El Mansour, mais aussi à Salé "
             "et Témara. Offerte dès 500 DH d’achat."),
        ]
        faq_h = 'Questions fréquentes'
        more = 'En savoir plus'
    else:
        title = 'بارافارماسي القنيطرة والرباط | ParaNajouaStep – بارافارماسي أونلاين'
        desc = ('ParaNajouaStep، البارافارماسي ديالك في القنيطرة: Avène، Bioderma، CeraVe، La Roche-Posay، Vichy… '
                'توصيل سريع إلى القنيطرة والرباط وسلا وتمارة. الدفع عند الاستلام.')
        h1 = 'البارافارماسي ديالك في القنيطرة، مع التوصيل حتى الرباط'
        lead = ('أشهر ماركات التجميل الجلدي بأثمنة مناسبة ونصائح حقيقية: Avène وBioderma وCeraVe وLa Roche-Posay وVichy وUriage وISDIN. '
                ' توصيل في نفس اليوم داخل القنيطرة، وخلال 24 ساعة إلى الرباط وسلا وتمارة. '
                'الدفع عند الاستلام.')
        cta1, cta2 = 'اكتشف المتجر', 'اطلب عبر واتساب'
        cats_h, best_h = 'أقسامنا', 'الأكثر طلباً'
        about_h = 'بارافارماسي الحي، في قلب القنيطرة'
        about_p = [
            'في ParaNajouaStep نختار كل منتج بعناية ليستجيب للاحتياجات الحقيقية للبشرة: الحساسية، الجفاف، الحبوب، البقع، '
            'الشمس وفروة الرأس. فريقنا يستقبلكم في المحل بالقنيطرة ويرافقكم أيضاً عن بعد عبر واتساب.',
            'تسكن في الرباط أو سلا أو تمارة أو سيدي قاسم أو سيدي سليمان؟ اطلب أونلاين ببضع نقرات: نجهز طلبيتك في نفس اليوم '
            'وتدفع ببساطة عند الاستلام.',
        ]
        local_h = 'بارافارماسي في القنيطرة وتوصيل إلى الرباط'
        local = [
            ('القنيطرة', 'parapharmacie-kenitra/',
             'استلام مجاني من المحل أو توصيل في نفس اليوم إلى جميع الأحياء: وسط المدينة، بئر الرامي، الميموزا، فال فلوري، '
             'لاسيكون، أولاد أوجيه، الساكنية، المعمورة وحتى المهدية.'),
            ('الرباط · سلا · تمارة', 'parapharmacie-rabat/',
             'توصيل خلال 24 ساعة إلى أكدال وحي الرياض والسويسي وحسان والمحيط ويعقوب المنصور، وأيضاً إلى سلا وتمارة. '
             'مجاني ابتداءً من 500 درهم.'),
        ]
        faq_h = 'الأسئلة الشائعة'
        more = 'اعرف المزيد'

    cats = ''.join(f'''<a class="cat-card" href="{c.href('categorie/' + k['slug'] + '/')}">
      <img src="{c.asset('img/products/' + k['cover'] + '.webp')}" width="640" height="640" alt="" loading="lazy">
      <span class="cat-name">{E(k[lang])}</span><span class="cat-n">{sum(1 for p in PRODUCTS if k['slug'] in p['cats'])} {E(t['products_n'])}</span></a>''' for k in CATEGORIES)
    local_html = ''.join(f'''<article class="local-card"><h3>{ICON['pin']}{E(n)}</h3><p>{E(txt)}</p><a class="link" href="{c.href(u)}">{E(more)} →</a></article>''' for n, u, txt in local)

    body = f'''
<section class="hero">
  <div class="wrap hero-in">
    <div class="hero-text">
      <p class="eyebrow">{ICON['leaf']}{E(t['tagline'])}</p>
      <h1 class="h1">{E(h1)}</h1>
      <p class="lead">{E(lead)}</p>
      <div class="hero-cta">
        <a class="btn" href="{c.href('boutique/')}">{E(cta1)}</a>
        <a class="btn btn-ghost" href="https://wa.me/{STORE['whatsapp']}" target="_blank" rel="noopener">{ICON['wa']}{E(cta2)}</a>
      </div>
    </div>
    <figure class="hero-media">
      <img src="{c.asset('img/hero.webp')}" srcset="{c.asset('img/hero-660.webp')} 660w, {c.asset('img/hero.webp')} 1320w" sizes="(max-width: 900px) 100vw, 55vw" width="1320" height="601" alt="{'منتجات CeraVe وBioderma وVichy وLa Roche-Posay وAvène المتوفرة في بارافارماسي ParaNajouaStep بالقنيطرة' if lang == 'ar' else 'Produits CeraVe, Bioderma, Vichy, La Roche-Posay, Avène disponibles à la parapharmacie ParaNajouaStep à Kénitra'}" fetchpriority="high">
    </figure>
  </div>
</section>
{trust(c)}
<section class="section">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2">{E(cats_h)}</h2><a class="link" href="{c.href('boutique/')}">{E(t['all'])} →</a></div>
    <div class="cats">{cats}</div>
  </div>
</section>
<section class="section section-alt">
  <div class="wrap">
    <div class="sec-head"><h2 class="h2">{E(best_h)}</h2><a class="link" href="{c.href('boutique/')}">{E(t['all'])} →</a></div>
    {grid(c, featured[:8])}
  </div>
</section>
<section class="section">
  <div class="wrap about">
    <div class="about-media"><video src="{c.asset('media/paranajouastep-logo.mp4')}" poster="{c.asset('media/logo-poster.webp')}" width="720" height="720" muted playsinline loop preload="none" data-autoplay aria-label="ParaNajouaStep – {E(t['tagline'])}"></video></div>
    <div class="about-text">
      <h2 class="h2">{E(about_h)}</h2>
      {''.join(f'<p>{E(x)}</p>' for x in about_p)}
      <p class="slogan">{E(t['slogan'])}</p>
    </div>
  </div>
</section>
<section class="section section-alt">
  <div class="wrap">
    <h2 class="h2">{E(local_h)}</h2>
    <div class="local">{local_html}</div>
  </div>
</section>
{faq_html(FAQ_HOME[lang], faq_h)}
'''
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-home',
                    jsonld=[store_ld(lang), website_ld(c), faq_ld(FAQ_HOME[lang])]))


def shop_toolbar(c, total):
    t = c.t
    return f'''<div class="toolbar">
  <p class="count"><span data-count>{total}</span> {E(t['products_n'])}</p>
  <label class="sort">{E(t['sort'])}
    <select data-sort><option value="pop">{E(t['sort_pop'])}</option><option value="asc">{E(t['sort_asc'])}</option><option value="desc">{E(t['sort_desc'])}</option></select>
  </label>
</div>
<p class="no-result" data-empty hidden>{E(t['no_result'])}</p>'''


def page_shop(lang):
    c = Ctx(lang, 'boutique/')
    t = c.t
    if lang == 'fr':
        title = 'Boutique parapharmacie en ligne – Kénitra, Rabat | ParaNajouaStep'
        desc = "Tous nos produits de parapharmacie : soins visage, nettoyants, solaires, cheveux et corps. Prix en DH, livraison Kénitra, Rabat, Salé, Témara."
        h1 = 'Boutique parapharmacie en ligne'
        intro = "Retrouvez toute notre sélection dermo-cosmétique, disponible en boutique à Kénitra et livrée à domicile à Rabat, Salé, Témara et partout au Maroc."
    else:
        title = 'متجر البارافارماسي أونلاين – القنيطرة والرباط | ParaNajouaStep'
        desc = 'جميع منتجات البارافارماسي: العناية بالوجه، المنظفات، واقيات الشمس، الشعر والجسم. الأثمنة بالدرهم والتوصيل إلى القنيطرة والرباط وسلا وتمارة.'
        h1 = 'متجر البارافارماسي أونلاين'
        intro = 'اكتشف كل تشكيلتنا من منتجات التجميل الجلدي، المتوفرة في المحل بالقنيطرة ومع التوصيل إلى المنزل في الرباط وسلا وتمارة وفي جميع مدن المغرب.'
    chips = f'<button class="chip" type="button" data-filter="" aria-pressed="true">{E(t["all"])}</button>' + ''.join(
        f'<button class="chip" type="button" data-filter="{k["slug"]}" aria-pressed="false">{E(k[lang])}</button>' for k in CATEGORIES)
    items = [(t['home'], ''), (t['shop'], 'boutique/')]
    body = f'''
<section class="page-head"><div class="wrap">{crumbs_html(c, items)}<h1 class="h1">{E(h1)}</h1><p class="lead">{E(intro)}</p></div></section>
<section class="section shop" data-shop><div class="wrap">
  <div class="chips" role="group" aria-label="{'الأقسام' if lang == 'ar' else 'Catégories'}">{chips}</div>
  {shop_toolbar(c, len(PRODUCTS))}
  {grid(c, PRODUCTS, 4)}
</div></section>'''
    itemlist = {'@context': 'https://schema.org', '@type': 'ItemList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'url': c.abs('produit/' + p['slug'] + '/'), 'name': p[lang]} for i, p in enumerate(PRODUCTS)]}
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-shop', jsonld=[crumbs_ld(c, items), itemlist]))


def page_category(lang, k):
    path = 'categorie/' + k['slug'] + '/'
    c = Ctx(lang, path)
    t = c.t
    prods = [p for p in PRODUCTS if k['slug'] in p['cats']]
    brands = sorted({p['brand'] for p in prods})
    if lang == 'fr':
        title = f"{k['fr']} – Parapharmacie Kénitra & Rabat | ParaNajouaStep"
        desc = f"{k['fr']} : {', '.join(brands)}. Achetez en ligne à prix DH chez ParaNajouaStep, parapharmacie à Kénitra, livraison à Rabat, Salé, Témara."
        h1 = f"{k['fr']} – parapharmacie à Kénitra"
    else:
        title = f"{k['ar']} – بارافارماسي القنيطرة والرباط | ParaNajouaStep"
        desc = f"{k['ar']}: {'، '.join(brands)}. اشترِ أونلاين بالدرهم من ParaNajouaStep، بارافارماسي في القنيطرة مع التوصيل إلى الرباط وسلا وتمارة."
        h1 = f"{k['ar']} – بارافارماسي القنيطرة"
    items = [(t['home'], ''), (t['shop'], 'boutique/'), (k[lang], path)]
    others = ''.join(f'<a class="chip" href="{c.href("categorie/" + o["slug"] + "/")}">{E(o[lang])}</a>' for o in CATEGORIES if o is not k)
    body = f'''
<section class="page-head"><div class="wrap">{crumbs_html(c, items)}<h1 class="h1">{E(h1)}</h1><p class="lead">{E(k['intro_' + lang])}</p></div></section>
<section class="section shop" data-shop><div class="wrap">
  {shop_toolbar(c, len(prods))}
  {grid(c, prods, 4)}
  <div class="chips chips-links">{others}</div>
</div></section>'''
    itemlist = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': k[lang], 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'url': c.abs('produit/' + p['slug'] + '/'), 'name': p[lang]} for i, p in enumerate(prods)]}
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-cat', jsonld=[crumbs_ld(c, items), itemlist]))


def page_product(lang, p):
    path = 'produit/' + p['slug'] + '/'
    c = Ctx(lang, path)
    t = c.t
    k = CAT[p['cat']]
    name = p[lang]
    size_txt = f" ({p['size']})" if p['size'] else ''
    if lang == 'fr':
        title = f"{name} – Prix {p['price']} DH | Parapharmacie Kénitra"
        desc = (f"Achetez {name}{size_txt} à {p['price']} DH chez ParaNajouaStep, parapharmacie à Kénitra. "
                f"Livraison Kénitra, Rabat, Salé, Témara · paiement à la livraison.")
        local = (f"Disponible dans notre parapharmacie à Kénitra et livré à domicile à Rabat, Salé et Témara en 24h.")
    else:
        title = f"{name} – الثمن {p['price']} درهم | بارافارماسي القنيطرة"
        desc = (f"اشترِ {name}{size_txt} بثمن {p['price']} درهم من ParaNajouaStep، بارافارماسي في القنيطرة. "
                f"التوصيل إلى القنيطرة والرباط وسلا وتمارة · الدفع عند الاستلام.")
        local = 'متوفر في البارافارماسي ديالنا بالقنيطرة ومع التوصيل إلى المنزل في الرباط وسلا وتمارة خلال 24 ساعة.'
    items = [(t['home'], ''), (t['shop'], 'boutique/'), (k[lang], 'categorie/' + k['slug'] + '/'), (name, path)]
    related = [x for x in PRODUCTS if x is not p and (set(x['cats']) & set(p['cats']))]
    related += [x for x in PRODUCTS if x is not p and x not in related and x.get('featured')]
    related = related[:4]
    ship_lines = ''
    for key, fr, ar, fee, free, dfr, dar in SHIPPING:
        if key in ('kenitra', 'rabat', 'retrait'):
            label = fr if lang == 'fr' else ar
            delay = dfr if lang == 'fr' else dar
            fee_s = ('مجاني' if lang == 'ar' else 'Gratuit') if fee == 0 else f"{price(lang, fee)} · {t['free_from']} {price(lang, free)}"
            ship_lines += f'<li><strong>{E(label)}</strong> — {E(delay)} · {fee_s}</li>'
    wa_text = (f"Bonjour ParaNajouaStep, je souhaite commander : {name}{size_txt} – {p['price']} DH" if lang == 'fr'
               else f"السلام عليكم ParaNajouaStep، بغيت نطلب: {name}{size_txt} – {p['price']} درهم")
    from urllib.parse import quote
    wa = f"https://wa.me/{STORE['whatsapp']}?text={quote(wa_text)}"
    benefits = ''.join(f'<li>{ICON["check"]}{E(b)}</li>' for b in p['benefits_' + lang])
    specs = f'<tr><th>{E(t["brand"])}</th><td>{E(p["brand"])}</td></tr>'
    if p['size']:
        specs += f'<tr><th>{E(t["size"])}</th><td>{E(p["size"])}</td></tr>'
    specs += f'<tr><th>{"القسم" if lang == "ar" else "Catégorie"}</th><td><a href="{c.href("categorie/" + k["slug"] + "/")}">{E(k[lang])}</a></td></tr>'
    body = f'''
<section class="product-page"><div class="wrap">
  {crumbs_html(c, items)}
  <div class="product">
    <figure class="product-media"><img src="{c.asset('img/products/' + p['slug'] + '.webp')}" width="640" height="640" alt="{E(name)}" fetchpriority="high"></figure>
    <div class="product-info">
      <p class="card-brand">{E(p['brand'])}</p>
      <h1 class="h1 product-title">{E(name)}</h1>
      <p class="lead">{E(p['short_' + lang])}</p>
      <p class="product-price"><span class="price big">{price(lang, p['price'])}</span>{f'<span class="size" dir="ltr">{E(p["size"])}</span>' if p['size'] else ''}<span class="stock">{ICON['check']}{E(t['in_stock'])}</span></p>
      <div class="buy">
        <div class="qty" data-qty><button type="button" data-step="-1" aria-label="-">−</button><input type="number" min="1" max="20" value="1" aria-label="{E(t['qty'])}"><button type="button" data-step="1" aria-label="+">+</button></div>
        <button class="btn btn-add-big" type="button" data-add="{p['slug']}" data-with-qty>{ICON['cart']}{E(t['add_long'])}</button>
      </div>
      <a class="btn btn-wa" href="{wa}" target="_blank" rel="noopener">{ICON['wa']}{E(t['order_wa'])}</a>
      <div class="ship-box">
        <p class="ship-h">{ICON['truck']}{E(t['delivery_box'])}</p>
        <ul>{ship_lines}</ul>
        <p class="muted">{ICON['cash']}{E(t['payment_box'])}</p>
      </div>
    </div>
  </div>
  <div class="product-details">
    <section><h2 class="h3">{E(t['desc'])}</h2><p>{E(p['desc_' + lang])}</p><p class="muted">{E(local)}</p></section>
    <section><h2 class="h3">{E(t['benefits'])}</h2><ul class="benefits">{benefits}</ul></section>
    <section><h2 class="h3">{E(t['usage'])}</h2><p>{E(p['usage_' + lang])}</p><table class="specs">{specs}</table></section>
  </div>
</div></section>
<section class="section section-alt"><div class="wrap"><h2 class="h2">{E(t['related'])}</h2>{grid(c, related)}</div></section>'''
    nxt = datetime.date(datetime.date.today().year + 1, 12, 31).isoformat()
    prod_ld = {
        '@context': 'https://schema.org', '@type': 'Product',
        'name': name, 'image': [img_abs('products/' + p['slug'] + '.webp')],
        'description': p['desc_' + lang], 'sku': p['slug'], 'category': k[lang],
        'brand': {'@type': 'Brand', 'name': p['brand']},
        'offers': {
            '@type': 'Offer', 'url': c.abs(path), 'priceCurrency': 'MAD', 'price': str(p['price']),
            'priceValidUntil': nxt, 'availability': 'https://schema.org/InStock',
            'itemCondition': 'https://schema.org/NewCondition', 'seller': {'@id': SITE + '/#store'},
            'shippingDetails': {
                '@type': 'OfferShippingDetails',
                'shippingRate': {'@type': 'MonetaryAmount', 'value': '20', 'currency': 'MAD'},
                'shippingDestination': {'@type': 'DefinedRegion', 'addressCountry': 'MA'},
                'deliveryTime': {'@type': 'ShippingDeliveryTime',
                                 'handlingTime': {'@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 1, 'unitCode': 'DAY'},
                                 'transitTime': {'@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 3, 'unitCode': 'DAY'}}},
        },
    }
    if p['size']:
        prod_ld['size'] = p['size']
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-product', og_type='product',
                    og_image=img_abs('products/' + p['slug'] + '.webp'), jsonld=[crumbs_ld(c, items), prod_ld]))


# ---- local SEO landing pages ----
CITY = {
    'kenitra': {
        'path': 'parapharmacie-kenitra/',
        'fr': {
            'title': 'Parapharmacie à Kénitra – ParaNajouaStep | Livraison le jour même',
            'desc': "ParaNajouaStep, parapharmacie à Kénitra : dermo-cosmétique, solaires, soins bébé et cheveux. Retrait gratuit en boutique ou livraison le jour même dans tout Kénitra.",
            'h1': 'Parapharmacie à Kénitra',
            'lead': "Une parapharmacie de proximité à Kénitra, avec les plus grandes marques dermo-cosmétiques, des prix clairs en dirhams et un conseil personnalisé.",
            'blocks': [
                ('Votre parapharmacie de confiance à Kénitra',
                 "Située au centre-ville de Kénitra, ParaNajouaStep réunit une sélection pointue de soins pour le visage, le corps et les cheveux : "
                 "CeraVe, Avène, Bioderma, La Roche-Posay, Vichy, Uriage, SVR, ISDIN, Eucerin et bien d’autres. Que vous cherchiez une crème "
                 "pour peau sensible, un écran solaire SPF 50+ pour les plages de Mehdia ou un shampooing anti-pelliculaire, notre équipe vous "
                 "conseille le produit adapté."),
                ('Livraison le jour même dans tous les quartiers de Kénitra',
                 "Commandez en ligne ou sur WhatsApp avant 16h et recevez votre colis le jour même : centre-ville, Bir Rami Est et Ouest, "
                 "Les Mimosas, Val Fleuri, La Cigogne, Ouled Oujih, Saknia, Khabazat, Maamora, Hay Al Fath, Ouled Arfa, Mehdia… "
                 "Livraison 20 DH, offerte dès 300 DH d’achat. Paiement en espèces à la livraison."),
                ('Retrait gratuit en boutique',
                 "Vous préférez passer nous voir ? Commandez en ligne et choisissez « Retrait en boutique » : votre commande est prête en une "
                 "heure, sans frais. Profitez-en pour demander un diagnostic de peau à notre parapharmacienne."),
            ],
            'faq': [
                ('Quelle est la meilleure parapharmacie à Kénitra pour les peaux sensibles ?',
                 "ParaNajouaStep propose les gammes de référence pour peaux sensibles (Avène Tolérance, Bioderma Sensibio, Uriage Xémose, Eucerin pH5) et un conseil personnalisé en boutique à Kénitra ou sur WhatsApp."),
                ('Livrez-vous à Mehdia et Sidi Taibi ?', "Oui, nous livrons Mehdia, Sidi Taibi et les environs de Kénitra, généralement le jour même."),
                ('Quels sont vos horaires à Kénitra ?', STORE['hours_fr']),
            ],
        },
        'ar': {
            'title': 'بارافارماسي في القنيطرة – ParaNajouaStep | توصيل في نفس اليوم',
            'desc': 'ParaNajouaStep بارافارماسي في القنيطرة: منتجات التجميل الجلدي، واقيات الشمس، العناية بالرضع والشعر. استلام مجاني من المحل أو توصيل في نفس اليوم داخل القنيطرة.',
            'h1': 'بارافارماسي في القنيطرة',
            'lead': 'بارافارماسي قريب منكم في القنيطرة، بأشهر ماركات التجميل الجلدي وأثمنة واضحة بالدرهم ونصائح شخصية.',
            'blocks': [
                ('البارافارماسي اللي تثقو فيه في القنيطرة',
                 'يقع ParaNajouaStep في وسط مدينة القنيطرة، ويضم تشكيلة مختارة من منتجات العناية بالوجه والجسم والشعر: '
                 'CeraVe وAvène وBioderma وLa Roche-Posay وVichy وUriage وSVR وISDIN وEucerin وغيرها. سواء كنت تبحث عن كريم '
                 'للبشرة الحساسة، أو واقي شمس SPF 50+ لشاطئ المهدية، أو شامبو ضد القشرة، فريقنا ينصحك بالمنتج المناسب.'),
                ('توصيل في نفس اليوم إلى جميع أحياء القنيطرة',
                 'اطلب أونلاين أو عبر واتساب قبل الساعة 16:00 وتوصل بطلبيتك في نفس اليوم: وسط المدينة، بئر الرامي الشرقية والغربية، '
                 'الميموزا، فال فلوري، لاسيكون، أولاد أوجيه، الساكنية، الخبازات، المعمورة، حي الفتح، أولاد عرفة، المهدية… '
                 'ثمن التوصيل 20 درهم، ومجاني ابتداءً من 300 درهم. الدفع نقداً عند الاستلام.'),
                ('الاستلام مجاناً من المحل',
                 'تفضل تزورنا؟ اطلب أونلاين واختر «الاستلام من المحل»: طلبيتك تكون جاهزة خلال ساعة وبدون مصاريف. '
                 'واستغل الفرصة لطلب تشخيص لبشرتك من المختصة ديالنا.'),
            ],
            'faq': [
                ('ما هو أفضل بارافارماسي في القنيطرة للبشرة الحساسة؟',
                 'يقترح ParaNajouaStep أشهر المنتجات المرجعية للبشرة الحساسة (Avène Tolérance وBioderma Sensibio وUriage Xémose وEucerin pH5) مع نصائح شخصية في المحل بالقنيطرة أو عبر واتساب.'),
                ('هل توصلون إلى المهدية وسيدي الطيبي؟', 'نعم، نوصل إلى المهدية وسيدي الطيبي ونواحي القنيطرة، غالباً في نفس اليوم.'),
                ('ما هي أوقات العمل في القنيطرة؟', STORE['hours_ar']),
            ],
        },
    },
    'rabat': {
        'path': 'parapharmacie-rabat/',
        'fr': {
            'title': 'Parapharmacie en ligne Rabat, Salé, Témara – Livraison 24h | ParaNajouaStep',
            'desc': "Parapharmacie en ligne livrée à Rabat, Salé et Témara en 24h : CeraVe, Avène, Bioderma, La Roche-Posay, Vichy. Paiement à la livraison, offerte dès 500 DH.",
            'h1': 'Parapharmacie en ligne à Rabat, Salé et Témara',
            'lead': "Basée à Kénitra, à 40 minutes de Rabat, ParaNajouaStep livre chaque jour la capitale et ses environs. Vos soins dermo-cosmétiques préférés, chez vous en 24h.",
            'blocks': [
                ('Livraison en 24h dans tout Rabat',
                 "Agdal, Hay Riad, Souissi, Hassan, L’Océan, Les Orangers, Yacoub El Mansour, Akkari, Hay Nahda, Youssoufia, Diour Jamaa… "
                 "Passez commande en ligne ou sur WhatsApp : votre colis est préparé le jour même à Kénitra et livré à votre porte le lendemain "
                 "au plus tard. Livraison 35 DH, offerte dès 500 DH."),
                ('Salé et Témara aussi',
                 "Nous livrons également Salé (Tabriquet, Bettana, Hay Salam, Sala Al Jadida) et Témara (Harhoura, Wifak, Massira), ainsi que "
                 "Skhirat et Bouknadel, aux mêmes conditions."),
                ('Les mêmes prix qu’en boutique, sans vous déplacer',
                 "Pas de majoration pour la livraison à distance : vous payez le prix affiché, en espèces à la réception. Besoin d’un conseil "
                 "avant de commander ? Notre parapharmacienne répond à vos questions sur WhatsApp, en français ou en arabe."),
            ],
            'faq': [
                ('Combien coûte la livraison à Rabat ?', "La livraison à Rabat, Salé et Témara coûte 35 DH et elle est offerte dès 500 DH d’achat."),
                ('En combien de temps suis-je livré à Rabat ?', "Sous 24h pour toute commande confirmée. Les commandes passées le matin sont souvent livrées le jour même."),
                ('Puis-je payer à la livraison à Rabat ?', "Oui, le paiement se fait en espèces à la réception de votre colis, partout à Rabat, Salé et Témara."),
            ],
        },
        'ar': {
            'title': 'بارافارماسي أونلاين الرباط وسلا وتمارة – توصيل 24 ساعة | ParaNajouaStep',
            'desc': 'بارافارماسي أونلاين مع التوصيل إلى الرباط وسلا وتمارة خلال 24 ساعة: CeraVe وAvène وBioderma وLa Roche-Posay وVichy. الدفع عند الاستلام، والتوصيل مجاني ابتداءً من 500 درهم.',
            'h1': 'بارافارماسي أونلاين في الرباط وسلا وتمارة',
            'lead': 'من القنيطرة، على بعد 40 دقيقة من الرباط، يوصل ParaNajouaStep كل يوم إلى العاصمة ونواحيها. منتجاتك المفضلة توصلك للدار خلال 24 ساعة.',
            'blocks': [
                ('توصيل خلال 24 ساعة إلى جميع أحياء الرباط',
                 'أكدال، حي الرياض، السويسي، حسان، المحيط، الليمون، يعقوب المنصور، العكاري، حي النهضة، اليوسفية، ديور الجامع… '
                 'اطلب أونلاين أو عبر واتساب: نجهز طلبيتك في نفس اليوم بالقنيطرة وتوصل لباب دارك في الغد على أقصى تقدير. '
                 'ثمن التوصيل 35 درهم، ومجاني ابتداءً من 500 درهم.'),
                ('سلا وتمارة أيضاً',
                 'نوصل كذلك إلى سلا (تابريكت، بطانة، حي السلام، سلا الجديدة) وتمارة (الهرهورة، الوفاق، المسيرة)، وإلى الصخيرات وبوقنادل بنفس الشروط.'),
                ('نفس أثمنة المحل بدون ما تتنقل',
                 'بدون أي زيادة على التوصيل: تدفع الثمن المعروض نقداً عند الاستلام. تحتاج نصيحة قبل الطلب؟ '
                 'المختصة ديالنا تجاوب على أسئلتك عبر واتساب بالعربية أو بالفرنسية.'),
            ],
            'faq': [
                ('شحال ثمن التوصيل إلى الرباط؟', 'ثمن التوصيل إلى الرباط وسلا وتمارة هو 35 درهم، ويكون مجانياً ابتداءً من 500 درهم.'),
                ('في كم من وقت كنتوصل في الرباط؟', 'خلال 24 ساعة لكل طلب مؤكد. الطلبات المسجلة في الصباح غالباً كتوصل في نفس اليوم.'),
                ('واش نقدر نخلص عند الاستلام في الرباط؟', 'نعم، الدفع يكون نقداً عند الاستلام في جميع أنحاء الرباط وسلا وتمارة.'),
            ],
        },
    },
}


def page_city(lang, key):
    d = CITY[key]
    x = d[lang]
    c = Ctx(lang, d['path'])
    t = c.t
    items = [(t['home'], ''), (x['h1'], d['path'])]
    featured = [p for p in PRODUCTS if p.get('featured')][:8]
    blocks = ''.join(f'<section class="prose-block"><h2 class="h2">{E(h)}</h2><p>{E(b)}</p></section>' for h, b in x['blocks'])
    cta = ('اطلب الآن' if lang == 'ar' else 'Commander maintenant')
    extra = map_embed(c) if key == 'kenitra' else shipping_table(c)
    body = f'''
<section class="page-head"><div class="wrap">{crumbs_html(c, items)}<h1 class="h1">{E(x['h1'])}</h1><p class="lead">{E(x['lead'])}</p>
<div class="hero-cta"><a class="btn" href="{c.href('boutique/')}">{E(cta)}</a><a class="btn btn-ghost" href="https://wa.me/{STORE['whatsapp']}" target="_blank" rel="noopener">{ICON['wa']}WhatsApp</a></div></div></section>
{trust(c)}
<section class="section"><div class="wrap city-grid"><div class="prose">{blocks}</div><aside class="city-aside">{extra}</aside></div></section>
<section class="section section-alt"><div class="wrap"><h2 class="h2">{'الأكثر طلباً' if lang == 'ar' else 'Les plus demandés'}</h2>{grid(c, featured)}</div></section>
{faq_html(x['faq'], 'الأسئلة الشائعة' if lang == 'ar' else 'Questions fréquentes')}'''
    s = store_ld(lang)
    if key == 'rabat':
        s = dict(s)
        s['areaServed'] = [{'@type': 'City', 'name': n} for n in ('Rabat', 'Salé', 'Témara', 'Skhirat', 'Bouknadel')]
    write(c, layout(c, title=x['title'], desc=x['desc'], body=body, page_class='page-city',
                    jsonld=[s, crumbs_ld(c, items), faq_ld(x['faq'])]))


def page_delivery(lang):
    c = Ctx(lang, 'livraison/')
    t = c.t
    if lang == 'fr':
        title = 'Livraison & paiement – Kénitra, Rabat, Maroc | ParaNajouaStep'
        desc = 'Frais et délais de livraison ParaNajouaStep : Kénitra le jour même, Rabat, Salé, Témara en 24h, tout le Maroc en 24–72h. Paiement à la livraison.'
        h1 = 'Livraison & paiement'
        paras = [
            ('Comment commander ?', "Ajoutez vos produits au panier, renseignez vos coordonnées puis validez : votre commande s’ouvre dans WhatsApp, "
                                    "il suffit de l’envoyer. Nous vous rappelons pour confirmer la livraison."),
            ('Paiement', "Le paiement se fait en espèces à la livraison, ou en boutique si vous choisissez le retrait à Kénitra."),
            ('Retours', "Un produit abîmé ou non conforme ? Contactez-nous sous 48h après réception : nous l’échangeons sans frais. "
                        "Pour des raisons d’hygiène, les produits ouverts ne sont ni repris ni échangés."),
        ]
    else:
        title = 'التوصيل والدفع – القنيطرة، الرباط، المغرب | ParaNajouaStep'
        desc = 'مصاريف ومدة التوصيل من ParaNajouaStep: القنيطرة في نفس اليوم، الرباط وسلا وتمارة خلال 24 ساعة، وجميع مدن المغرب خلال 24–72 ساعة. الدفع عند الاستلام.'
        h1 = 'التوصيل والدفع'
        paras = [
            ('كيف أطلب؟', 'أضف المنتجات إلى السلة، املأ معلوماتك ثم أكد الطلب: تنفتح طلبيتك في واتساب، ما عليك إلا إرسالها. '
                          'نتصل بك لتأكيد التوصيل.'),
            ('الدفع', 'الدفع يكون نقداً عند الاستلام، أو في المحل إذا اخترت الاستلام من القنيطرة.'),
            ('الإرجاع', 'منتج متضرر أو غير مطابق؟ اتصل بنا خلال 48 ساعة من الاستلام وسنستبدله بدون مصاريف. '
                        'لأسباب صحية، لا يتم إرجاع أو استبدال المنتجات المفتوحة.'),
        ]
    items = [(t['home'], ''), (h1, 'livraison/')]
    body = f'''
<section class="page-head"><div class="wrap">{crumbs_html(c, items)}<h1 class="h1">{E(h1)}</h1></div></section>
<section class="section"><div class="wrap narrow">{shipping_table(c)}
{''.join(f'<section class="prose-block"><h2 class="h2">{E(h)}</h2><p>{E(p)}</p></section>' for h, p in paras)}</div></section>'''
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-delivery', jsonld=[crumbs_ld(c, items)]))


def page_contact(lang):
    c = Ctx(lang, 'contact/')
    t = c.t
    if lang == 'fr':
        title = 'Contact & adresse – Parapharmacie ParaNajouaStep Kénitra'
        desc = f"Adresse, téléphone, WhatsApp et horaires de la parapharmacie ParaNajouaStep à Kénitra. {STORE['hours_fr']}."
        h1 = 'Contact & accès'
        lead = "Passez nous voir à Kénitra ou écrivez-nous : nous répondons en français et en arabe."
    else:
        title = 'اتصل بنا والعنوان – بارافارماسي ParaNajouaStep القنيطرة'
        desc = f"العنوان والهاتف وواتساب وأوقات عمل بارافارماسي ParaNajouaStep في القنيطرة. {STORE['hours_ar']}."
        h1 = 'اتصل بنا'
        lead = 'زورونا في القنيطرة أو راسلونا: نجاوب بالعربية وبالفرنسية.'
    items = [(t['home'], ''), (h1, 'contact/')]
    body = f'''
<section class="page-head"><div class="wrap">{crumbs_html(c, items)}<h1 class="h1">{E(h1)}</h1><p class="lead">{E(lead)}</p></div></section>
<section class="section"><div class="wrap city-grid">
  <div class="contact-cards">
    <a class="contact-card" href="https://wa.me/{STORE['whatsapp']}" target="_blank" rel="noopener">{ICON['wa']}<span><strong>WhatsApp</strong><span dir="ltr">{E(STORE['phone_display'])}</span></span></a>
    <a class="contact-card" href="tel:{STORE['phone_tel']}">{ICON['phone']}<span><strong>{'الهاتف' if lang == 'ar' else 'Téléphone'}</strong><span dir="ltr">{E(STORE['phone_display'])}</span></span></a>
    <div class="contact-card">{ICON['pin']}<span><strong>{'العنوان' if lang == 'ar' else 'Adresse'}</strong><span>{E(STORE['street_fr'] if lang == 'fr' else STORE['street_ar'])}, {'القنيطرة' if lang == 'ar' else 'Kénitra'} {STORE['postal_code']}</span></span></div>
    <div class="contact-card">{ICON['clock']}<span><strong>{E(t['hours'])}</strong><span>{E(STORE['hours_fr'] if lang == 'fr' else STORE['hours_ar'])}</span></span></div>
    <a class="contact-card" href="mailto:{STORE['email']}">{ICON['chat']}<span><strong>Email</strong><span>{E(STORE['email'])}</span></span></a>
  </div>
  <aside class="city-aside">{map_embed(c)}</aside>
</div></section>'''
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-contact', jsonld=[store_ld(lang), crumbs_ld(c, items)]))


def page_cart(lang):
    c = Ctx(lang, 'panier/')
    t = c.t
    opts = ''.join(f'<option value="{s[0]}">{E(s[1] if lang == "fr" else s[2])}</option>' for s in SHIPPING)
    if lang == 'fr':
        L = dict(h1='Mon panier', empty='Votre panier est vide.', go='Découvrir la boutique', recap='Récapitulatif',
                 sub='Sous-total', ship='Livraison', total='Total', info='Vos coordonnées', name='Nom complet', phone='Téléphone',
                 city='Ville / mode de livraison', addr='Adresse de livraison', addr_ph='Quartier, rue, n°, repère…', note='Remarque (facultatif)',
                 pay='Paiement en espèces à la livraison.', submit='Valider la commande sur WhatsApp',
                 legal='En validant, votre commande s’ouvre dans WhatsApp : envoyez le message pour la confirmer.',
                 done_h='Merci ! Votre commande est prête', done_p='Si WhatsApp ne s’est pas ouvert, utilisez le bouton ci-dessous. Nous vous rappelons rapidement pour confirmer la livraison.',
                 done_btn='Ouvrir WhatsApp', back='Continuer mes achats')
        title, desc = 'Mon panier | ParaNajouaStep', 'Votre panier ParaNajouaStep.'
    else:
        L = dict(h1='سلتي', empty='سلتك فارغة.', go='اكتشف المتجر', recap='ملخص الطلب',
                 sub='المجموع الفرعي', ship='التوصيل', total='المجموع', info='معلوماتك', name='الاسم الكامل', phone='رقم الهاتف',
                 city='المدينة / طريقة التوصيل', addr='عنوان التوصيل', addr_ph='الحي، الزنقة، الرقم، علامة…', note='ملاحظة (اختياري)',
                 pay='الدفع نقداً عند الاستلام.', submit='أكد الطلب عبر واتساب',
                 legal='عند التأكيد تنفتح طلبيتك في واتساب: أرسل الرسالة لتأكيدها.',
                 done_h='شكراً! طلبيتك جاهزة', done_p='إذا لم ينفتح واتساب، استعمل الزر أسفله. سنتصل بك قريباً لتأكيد التوصيل.',
                 done_btn='افتح واتساب', back='متابعة التسوق')
        title, desc = 'سلتي | ParaNajouaStep', 'سلة مشترياتك في ParaNajouaStep.'
    items = [(t['home'], ''), (L['h1'], 'panier/')]
    body = f'''
<section class="page-head slim"><div class="wrap">{crumbs_html(c, items)}<h1 class="h1">{E(L['h1'])}</h1></div></section>
<section class="section cart-page" data-cart-page><div class="wrap">
  <div class="cart-empty" data-cart-empty hidden><p>{E(L['empty'])}</p><a class="btn" href="{c.href('boutique/')}">{E(L['go'])}</a></div>
  <div class="cart-layout" data-cart-full hidden>
    <div>
      <ul class="cart-lines" data-cart-lines></ul>
      <form class="checkout" data-checkout novalidate>
        <h2 class="h3">{E(L['info'])}</h2>
        <div class="field-row">
          <label class="field">{E(L['name'])}<input name="name" required autocomplete="name"></label>
          <label class="field">{E(L['phone'])}<input name="phone" type="tel" required autocomplete="tel" inputmode="tel" pattern="[0-9 +]{{9,16}}" dir="ltr" placeholder="06 00 00 00 00"></label>
        </div>
        <label class="field">{E(L['city'])}<select name="city" data-city required>{opts}</select></label>
        <label class="field" data-addr-field>{E(L['addr'])}<input name="address" required autocomplete="street-address" placeholder="{E(L['addr_ph'])}"></label>
        <label class="field">{E(L['note'])}<textarea name="note" rows="2"></textarea></label>
        <p class="muted">{ICON['cash']}{E(L['pay'])}</p>
        <button class="btn btn-wa btn-block" type="submit">{ICON['wa']}{E(L['submit'])}</button>
        <p class="muted small">{E(L['legal'])}</p>
      </form>
    </div>
    <aside class="summary">
      <h2 class="h3">{E(L['recap'])}</h2>
      <dl>
        <div><dt>{E(L['sub'])}</dt><dd data-sub></dd></div>
        <div><dt>{E(L['ship'])}</dt><dd data-ship></dd></div>
        <div class="sum-total"><dt>{E(L['total'])}</dt><dd data-total></dd></div>
      </dl>
      <p class="muted small" data-free-hint></p>
    </aside>
  </div>
  <div class="cart-done" data-cart-done hidden>
    {ICON['check']}
    <h2 class="h2">{E(L['done_h'])}</h2>
    <p class="order-ref" data-order-ref></p>
    <p>{E(L['done_p'])}</p>
    <div class="hero-cta center"><a class="btn btn-wa" data-wa-again target="_blank" rel="noopener">{ICON['wa']}{E(L['done_btn'])}</a><a class="btn btn-ghost" href="{c.href('boutique/')}">{E(L['back'])}</a></div>
  </div>
</div></section>'''
    write(c, layout(c, title=title, desc=desc, body=body, page_class='page-cart', noindex=True), sitemap=False)


def page_404():
    c = Ctx('fr', '')
    body = f'''<section class="section"><div class="wrap narrow center">
<h1 class="h1">Page introuvable · الصفحة غير موجودة</h1>
<p class="lead">Cette page n’existe pas ou a été déplacée.</p>
<p class="lead" dir="rtl" lang="ar">هذه الصفحة غير موجودة أو تم نقلها.</p>
<div class="hero-cta center"><a class="btn" href="/">Accueil</a><a class="btn btn-ghost" href="/ar/">الرئيسية</a></div>
</div></section>'''
    out = layout(c, title='Page introuvable | ParaNajouaStep', desc='Page introuvable.', body=body, noindex=True)
    # 404 is served from any URL depth, so use absolute asset paths there
    out = out.replace('data-root="./"', 'data-root="/"').replace('href="./', 'href="/').replace('src="./', 'src="/')
    with open(os.path.join(OUT, '404.html'), 'w', encoding='utf-8') as f:
        f.write(out)


# ------------------------------------------------------------------ extras
def write_catalog():
    cat = {p['slug']: {'b': p['brand'], 'p': p['price'], 's': p['size'], 'fr': p['fr'], 'ar': p['ar']} for p in PRODUCTS}
    ship = [{'k': s[0], 'fr': s[1], 'ar': s[2], 'fee': s[3], 'free': s[4], 'dfr': s[5], 'dar': s[6]} for s in SHIPPING]
    js = ('/* generated by _src/build.py — do not edit by hand */\n'
          'window.PNS_CATALOG=' + json.dumps(cat, ensure_ascii=False) + ';\n'
          'window.PNS_SHIPPING=' + json.dumps(ship, ensure_ascii=False) + ';\n'
          'window.PNS_WHATSAPP=' + json.dumps(STORE['whatsapp']) + ';\n')
    with open(os.path.join(OUT, 'assets', 'js', 'catalog.js'), 'w', encoding='utf-8') as f:
        f.write(js)


def write_sitemap():
    urls = []
    for path in SITEMAP:
        pri = '1.0' if path == '' else '0.9' if path.startswith(('parapharmacie-', 'boutique')) else '0.8' if path.startswith(('produit', 'categorie')) else '0.5'
        for lang in ('fr', 'ar'):
            loc = SITE + '/' + ('ar/' if lang == 'ar' else '') + path
            img = ''
            if path.startswith('produit/'):
                slug = path.split('/')[1]
                img = f'<image:image><image:loc>{img_abs("products/" + slug + ".webp")}</image:loc></image:image>'
            urls.append(
                f'<url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><priority>{pri}</priority>'
                f'<xhtml:link rel="alternate" hreflang="fr-MA" href="{SITE}/{path}"/>'
                f'<xhtml:link rel="alternate" hreflang="ar-MA" href="{SITE}/ar/{path}"/>'
                f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/{path}"/>{img}</url>')
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
           + '\n'.join(urls) + '\n</urlset>\n')
    with open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(xml)
    with open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf-8') as f:
        f.write(f'User-agent: *\nAllow: /\nDisallow: /panier/\nDisallow: /ar/panier/\nDisallow: /_src/\n\nSitemap: {SITE}/sitemap.xml\n')
    manifest = {
        'name': 'ParaNajouaStep – Parapharmacie Kénitra', 'short_name': 'ParaNajouaStep', 'lang': 'fr-MA',
        'start_url': './', 'display': 'standalone', 'background_color': '#faf6ee', 'theme_color': '#4f5d38',
        'icons': [{'src': 'assets/img/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                  {'src': 'assets/img/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}
    with open(os.path.join(OUT, 'site.webmanifest'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)


def clean():
    for d in ('boutique', 'categorie', 'produit', 'parapharmacie-kenitra', 'parapharmacie-rabat', 'livraison', 'contact', 'panier', 'ar'):
        shutil.rmtree(os.path.join(OUT, d), ignore_errors=True)


def main():
    clean()
    for lang in ('fr', 'ar'):
        page_home(lang)
        page_shop(lang)
        for k in CATEGORIES:
            page_category(lang, k)
        for p in PRODUCTS:
            page_product(lang, p)
        page_city(lang, 'kenitra')
        page_city(lang, 'rabat')
        page_delivery(lang)
        page_contact(lang)
        page_cart(lang)
    page_404()
    write_catalog()
    write_sitemap()
    print(f'Built {len(SITEMAP) * 2} indexable pages (+ cart, 404) into {OUT}')


if __name__ == '__main__':
    main()
