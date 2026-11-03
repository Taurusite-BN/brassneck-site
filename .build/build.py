"""Assemble every page of the site from the shared chrome and one body part.

Run from anywhere; it chdirs to the repo root. Re-runnable.

    python3 .build/build.py            # pages + redirect stubs + sitemap
    python3 .build/build.py sections   # pages only

Changed 3 Nov 2026: the homepage is generated too. It used to be
maintained by hand, which meant the masthead and footer existed in two
places and drifted apart. Everything with a masthead now comes from
`page()` below, so a change to the chrome is one edit.
"""
import os, sys

ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
os.chdir(ROOT)

SITE = 'https://brassneck.studio'
OG_ALT = ("The Brassneck Studio logo: a capital B drawn as a character, "
          "with two eyes and a pair of legs.")
UMAMI = ('<script defer src="https://cloud.umami.is/script.js" '
         'data-website-id="765c87cc-8889-4745-a637-c8597fb3c7cc"></script>')


def mast(current):
    """Websites and Apps are one conversation, so Apps hangs off Websites
    rather than taking a fifth slot in the bar."""
    sites_current = ' aria-current="true"' if current in ('websites', 'apps') else ''
    def nav(key, href, label):
        cur = ' aria-current="page"' if key == current else ''
        return f'      <a href="{href}"{cur}>{label}</a>'
    return f'''  <header class="mast">
    <a class="mast-home" href="/" aria-label="Brassneck Studio, home">
      <span class="mast-mark">
        <img class="lockup mark-up" src="/assets/logo/icon-white.svg" alt="Brassneck Studio" width="333" height="461">
        <img class="lockup mark-dn" src="/assets/logo/icon-white.svg" alt="" aria-hidden="true" width="333" height="461">
      </span>
    </a>
    <nav class="mast-nav" aria-label="Main">
      <div class="nav-drop" data-open="false">
        <button class="nav-top" type="button" aria-expanded="false" aria-controls="nav-sites"{sites_current}>Websites
          <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>
        </button>
        <div class="nav-menu" id="nav-sites">
          <a href="/websites/">Websites</a>
          <a href="/apps/">Apps</a>
        </div>
      </div>
{nav('games', '/games/', 'Games')}
{nav('studio', '/studio/', 'Studio')}
      <a class="mast-cta" href="/contact/"{' aria-current="page"' if current == 'contact' else ''}>Get in contact</a>
    </nav>
  </header>'''


FOOT = '''  <footer class="foot">
    <div class="foot-in">
      <a href="/" aria-label="Brassneck Studio, home">
        <img class="lockup" src="/assets/logo/landscape-white.svg" alt="Brassneck Studio" width="994" height="463" loading="lazy">
      </a>
      <div class="foot-links">
        <a href="/websites/">Websites</a><a href="/apps/">Apps</a><a href="/games/">Games</a><a href="/studio/">Studio</a><a href="/contact/">Contact</a><a href="/legal/privacy/">Privacy</a><a href="/legal/privacy/#cookies">Cookies</a><a href="/legal/terms/">Terms</a>
      </div>
    </div>
    <p class="foot-fine"><a href="mailto:oliver@brassneck.studio">oliver@brassneck.studio</a> &middot; Plymouth, UK &middot; Working internationally</p>
    <p class="foot-fine">Brassneck Studio Ltd, registered in England and Wales, company number 17431166. Registered office: 4 Earls Acre, Plymouth, PL3 4HL. Not VAT registered.</p>
  </footer>'''


def page(path, title, desc, nav, body, extras='', og_title=None, preload='', shell=False):
    url = SITE + path
    main_class = ' class="shell"' if shell else ''
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Brassneck Studio">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{og_title or title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{SITE}/assets/og-card.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{OG_ALT}">
  <meta name="twitter:card" content="summary_large_image">

  <meta name="theme-color" content="#280700">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">

  {preload}<link rel="preload" href="/assets/fonts/darkergrotesque-var-sub.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/anton-regular-sub.woff2" as="font" type="font/woff2" crossorigin>

  <link rel="stylesheet" href="/css/styles.css">
  {UMAMI}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{mast(nav)}

<main id="main"{main_class}>
{body}
</main>

{FOOT}
{extras}
  <script src="/js/site.js" defer></script>
</body>
</html>
'''


PAGES = {
 'index': dict(
   path='/', out='index.html', nav='home',
   title='Brassneck Studio: websites, apps and games, built by hand',
   og_title='Brassneck Studio',
   desc=('Hand-built websites, web apps and installable apps for small businesses. '
         'From £950, first year’s hosting included. Plymouth based, working internationally.')),
 'websites': dict(
   path='/websites/', nav='websites', modal=True,
   title='Websites from £950, hosting included | Brassneck Studio',
   og_title='Websites that earn their keep',
   desc=('Hand-built websites for small businesses. £950 for one page, £1,650 for five to '
         'seven, first year’s hosting included. Plymouth based, working internationally.')),
 'apps': dict(
   path='/apps/', nav='apps',
   title='Web apps and installable apps from £1,200 | Brassneck Studio',
   og_title='Apps that open from an icon',
   desc=('Booking systems, portals, dashboards and calculators, built for the browser and '
         'installable to a phone home screen. From £1,200. Plymouth based.')),
 'games': dict(
   path='/games/', nav='games', shell=True,
   title='Games in development | Brassneck Studio',
   og_title='Two games in development',
   desc=('Two games in development: a point-and-click murder mystery aboard a brig, and a dry '
         'British comedy set in a secondary school. Devlogs as the work happens.'),
   preload=('<link rel="preload" as="image" href="/assets/games/articles-key-800.webp"\n'
            '        imagesrcset="/assets/games/articles-key-800.webp 800w, /assets/games/articles-key-1200.webp 1200w, /assets/games/articles-key-1600.webp 1600w"\n'
            '        imagesizes="(min-width: 1830px) 1720px, (min-width: 700px) 94vw, 50vw" fetchpriority="high">\n  ')),
 'studio': dict(
   path='/studio/', nav='studio',
   title='The studio, and why it does both | Brassneck Studio',
   og_title='Why a web studio also makes games',
   desc=('Brassneck Studio builds websites and develops games. The same skill in two rooms: '
         'structure, writing, interface, testing and measurement.')),
 'contact': dict(
   path='/contact/', nav='contact',
   title='Contact | Brassneck Studio',
   og_title='Tell us what you need',
   desc=('Tell us what the site is for, who it is for, and what you want them to do when they '
         'get there. Replies usually within a day.')),
}


def build_sections():
    modal = open('.build/svc-modal.part.html', encoding='utf-8').read()
    for name, cfg in PAGES.items():
        body = open(f'.build/{name}.part.html', encoding='utf-8').read()
        extras = '\n' + modal + '\n' if cfg.get('modal') else ''
        html = page(cfg['path'], cfg['title'], cfg['desc'], cfg['nav'], body,
                    extras=extras, og_title=cfg.get('og_title'),
                    preload=cfg.get('preload', ''), shell=cfg.get('shell', False))
        out = cfg.get('out') or f'{name}/index.html'
        os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
        open(out, 'w', encoding='utf-8').write(html)
        print(f'  wrote {out:24} {len(html):>7,}')


STUB = '''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url={to}">
<link rel="canonical" href="https://brassneck.studio{to}">
<meta name="robots" content="noindex">
<title>Moved</title>
</head>
<body>
<p>This page has moved to <a href="{to}">{to}</a>.</p>
<script>location.replace("{to}" + location.hash);</script>
</body>
</html>
'''

# old path -> new path. Each of these is a URL that is in the sitemap or
# linked from somewhere outside the site, so it keeps working.
MOVES = {
  'work/ember8.html':                     '/work/ember8/',
  'legal/privacy.html':                   '/legal/privacy/',
  'legal/terms.html':                     '/legal/terms/',
  'devlog/2026-08-28-entry-one.html':     '/devlog/2026-08-28-entry-one/',
  'devlog/2026-09-04-entry-two.html':     '/devlog/2026-09-04-entry-two/',
  'devlog/2026-09-20-scuttlers-one.html': '/devlog/2026-09-20-scuttlers-one/',
}


def build_stubs():
    for old, new in MOVES.items():
        open(old, 'w', encoding='utf-8').write(STUB.format(to=new))
        print(f'  stub  {old} -> {new}')


SITEMAP = [
  ('/',                                   'monthly', '1.0'),
  ('/websites/',                          'monthly', '0.9'),
  ('/apps/',                              'monthly', '0.8'),
  ('/contact/',                           'yearly',  '0.8'),
  ('/games/',                             'weekly',  '0.7'),
  ('/work/ember8/',                       'yearly',  '0.7'),
  ('/studio/',                            'monthly', '0.6'),
  ('/devlog/2026-11-02-entry-three/',     'yearly',  '0.5'),
  ('/devlog/2026-09-20-scuttlers-one/',   'yearly',  '0.5'),
  ('/devlog/2026-09-04-entry-two/',       'yearly',  '0.5'),
  ('/devlog/2026-08-28-entry-one/',       'yearly',  '0.5'),
  ('/legal/privacy/',                     'yearly',  '0.3'),
  ('/legal/terms/',                       'yearly',  '0.3'),
]


def build_sitemap():
    rows = '\n'.join(
        f'  <url><loc>{SITE}{p}</loc><changefreq>{c}</changefreq><priority>{pr}</priority></url>'
        for p, c, pr in SITEMAP)
    open('sitemap.xml', 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows + '\n</urlset>\n')
    print(f'  sitemap.xml  {len(SITEMAP)} urls')


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if what in ('all', 'sections'):
        build_sections()
    if what in ('all', 'stubs'):
        build_stubs()
    if what in ('all', 'sitemap'):
        build_sitemap()
