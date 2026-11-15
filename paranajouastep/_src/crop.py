"""Crop the individual product photos and the logo out of the source media.

Run once (or after changing a box):  python3 _src/crop.py <products.jpg> <logo_frame.png>
Writes assets/img/products/<slug>.webp, assets/img/hero.webp, assets/img/logo-*.png
"""
import sys, os
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'img')

# (slug, left, top, right, bottom) in the 1320x629 source photo
BOXES = [
    ('eucerin-ph5-lotion', 203, 0, 352, 330),
    ('gleamy-eau-micellaire', 366, 18, 506, 330),
    ('cerave-creme-hydratante', 530, 15, 702, 330),
    ('d-white-creme-eclaircissante-spf50', 733, 55, 922, 300),
    ('d-cap-shampooing-antipelliculaire', 952, 20, 1108, 285),
    ('avene-tolerance-creme-apaisante', 52, 300, 203, 585),
    ('svr-hydraliane-creme-legere', 206, 340, 384, 605),
    ('bioderma-sensibio-h2o', 430, 262, 580, 629),
    ('vichy-mineral-89', 578, 315, 692, 629),
    ('la-roche-posay-effaclar-gel-moussant', 686, 258, 797, 629),
    ('uriage-xemose-creme-relipidante', 793, 312, 950, 629),
    ('isdin-fotoprotector-fusion-water-spf50', 936, 355, 1064, 629),
    ('dcp-creme-intense-hydratante', 1048, 322, 1187, 615),
    ('dercos-vichy-shampooing-antipelliculaire', 1178, 325, 1308, 615),
]

def product_tiles(src):
    im = Image.open(src).convert('RGB')
    os.makedirs(os.path.join(OUT, 'products'), exist_ok=True)
    for slug, l, t, r, b in BOXES:
        crop = im.crop((l, t, r, b))
        w, h = crop.size
        side = max(w, h)
        # square canvas, filled with the photo's own warm-cream tone
        bg = (244, 233, 214)
        canvas = Image.new('RGB', (side, side), bg)
        canvas.paste(crop, ((side - w) // 2, (side - h) // 2))
        canvas = canvas.resize((640, 640), Image.LANCZOS)
        canvas.save(os.path.join(OUT, 'products', slug + '.webp'), quality=86, method=6)
    # Hero banner: drop the clipped slogan line at the top
    hero = im.crop((0, 28, im.width, im.height))
    hero.save(os.path.join(OUT, 'hero.webp'), quality=84, method=6)
    hero.resize((660, int(660 * hero.height / hero.width)), Image.LANCZOS).save(
        os.path.join(OUT, 'hero-660.webp'), quality=82, method=6)
    og = im.resize((1200, int(1200 * im.height / im.width)), Image.LANCZOS)
    canvas = Image.new('RGB', (1200, 630), (247, 241, 228))
    canvas.paste(og, (0, (630 - og.height) // 2))
    canvas.save(os.path.join(OUT, 'og-image.jpg'), quality=85)

def keyed(im, bg):
    """Remove the cream background -> RGBA with soft edges."""
    im = im.convert('RGB')
    px = im.load()
    out = Image.new('RGBA', im.size)
    po = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            d = max(bg[0] - r, bg[1] - g, bg[2] - b, 0)
            a = min(1.0, d / 70.0)
            if a <= 0.02:
                po[x, y] = (0, 0, 0, 0); continue
            cr = int(max(0, min(255, (r - bg[0] * (1 - a)) / a)))
            cg = int(max(0, min(255, (g - bg[1] * (1 - a)) / a)))
            cb = int(max(0, min(255, (b - bg[2] * (1 - a)) / a)))
            po[x, y] = (cr, cg, cb, int(a * 255))
    return out

def logo(src):
    im = Image.open(src).convert('RGB')
    bg = (248, 243, 230)
    mono = keyed(im.crop((262, 85, 848, 668)), bg)
    mono.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, 'logo-mark.png'), optimize=True)
    mono.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'logo-mark-512.png'), optimize=True)
    full = keyed(im.crop((60, 85, 1030, 1040)), bg)
    full.resize((485, 478), Image.LANCZOS).save(os.path.join(OUT, 'logo-full.png'), optimize=True)
    # favicons on solid cream
    for s in (32, 180, 192, 512):
        c = Image.new('RGB', (s, s), (250, 246, 238))
        m = mono.resize((int(s * .9), int(s * .9)), Image.LANCZOS)
        c.paste(m, ((s - m.width) // 2, (s - m.height) // 2), m)
        c.save(os.path.join(OUT, f'icon-{s}.png'), optimize=True)

if __name__ == '__main__':
    product_tiles(sys.argv[1])
    logo(sys.argv[2])
