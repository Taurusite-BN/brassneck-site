# Brassneck Studio — the site

Hand-written static HTML on GitHub Pages at `brassneck.studio`. Six pages that sell the
web and app work, a case study, two games with their devlogs, the legal pages, and a set
of demonstration builds that the service examples open onto.

**Restructured 27 Oct 2026.** It used to be one document with four views, a camera and a
client-side router; every URL now serves its own page. See "The move to real pages" below.

**Redesigned 3 Nov 2026.** The six brand pages were rebuilt on the colour-plane system.
See "The plane system" below, and `claude/site-design-rules.md` in the project, which is
the canonical design record.

## READ THIS FIRST: the six brand pages are generated

`/`, `/websites/`, `/apps/`, `/games/`, `/studio/` and `/contact/` are **written by
`.build/build.py`**. Editing those `index.html` files by hand works until the next build,
which silently overwrites them. The chrome (head, masthead, footer, script tag) lives in
`build.py`; each page's body lives in `.build/<name>.part.html`.

```
python3 .build/build.py            # the six pages + redirect stubs + sitemap
python3 .build/build.py sections   # the six pages only
```

Re-runnable and deterministic — running it on a clean checkout reproduces the committed
HTML byte for byte, which is the check that it has not drifted.

**Not generated, edit directly:** `/work/ember8/`, `/legal/privacy/`, `/legal/terms/`,
the three `/devlog/` entries, `404.html` and everything under `demo/`. Those still carry
their own copy of the masthead, so a change to the chrome has to be made in both places.

## Run it

1. Open the `brassneck-site` folder in VS Code (**File → Open Folder** — pick the folder,
   not a file).
2. Right-click `index.html` → **Open with Live Server**.

Live Server is not optional. Every path in the site is root-absolute (`/css/styles.css`,
`/assets/...`, `/websites/`), which is what makes a directory-per-page layout work at any
depth. Opened from Finder over `file://` those resolve against the filesystem root and
nothing loads.

If you don't have it: VS Code → Extensions → search "Live Server" (Ritwick Dey).

## The move to real pages

**The problem it solved.** Addresses looked like `index.html#games`. Every page shared one
42 KB document and one 45 KB script, so arriving at the Games section still paid for the
3D doors, the camera, the particle field and the router.

**The shape now.** One directory per page, each with its own `index.html`:

| URL | File |
|---|---|
| `/` | `index.html` |
| `/websites/` | `websites/index.html` |
| `/apps/` | `apps/index.html` (added 3 Nov 2026; hangs off Websites in the nav) |
| `/games/` | `games/index.html` |
| `/studio/` | `studio/index.html` |
| `/contact/` | `contact/index.html` |
| `/work/ember8/` | `work/ember8/index.html` |
| `/legal/privacy/`, `/legal/terms/` | `legal/*/index.html` |
| `/devlog/<slug>/` | `devlog/<slug>/index.html` |

Directory-plus-`index.html` rather than `websites.html`, because that serves correctly on
any host. GitHub Pages happens to resolve `/websites` to `websites.html` too, but that is
a host behaviour rather than a guarantee, and the canonical URL would then disagree with
the file.

**Nothing 404s.** Every old URL that was in the sitemap or linked from outside — the case
study, both legal pages, all three devlog entries — still exists as a one-line redirect
stub at its old path, carrying a canonical to the new one. `404.html` catches the rest and
lists the whole site.

**What went with it.** `js/threshold.js` (the particle field, the magnetic body text, the
3D doors, the camera dive, the router and the tuning panel) is gone, replaced by
`js/site.js` at less than half the size. 145 CSS rules that could no longer match anything
went too — verified by screenshotting all ten pages at two widths before and after and
diffing them pixel by pixel, which came back identical.

## Files

```
.build/build.py         generates the six brand pages, the stubs and the sitemap
.build/*.part.html      the body of each generated page — EDIT THESE, not the index.html
index.html              the homepage                      } generated
websites/ apps/ games/  one directory per page             } generated
studio/ contact/                                           } generated
work/ember8/            the case study                     — hand-maintained
legal/privacy|terms/    the legal pages                    — hand-maintained
devlog/<slug>/          one directory per entry            — hand-maintained
demo/northwell/         a demonstration client site, its web app and its traffic report
css/styles.css          tokens, the plane system, components, then the legacy band system
js/site.js              masthead tone, nav drop, the reel, the form, roster, examples
assets/                 logo colourways, subset fonts, example images, the door recording
*.html (old paths)      redirect stubs, kept so existing links survive
```

## The preview gate (removed, 3 Sep 2026)

The site used to open on a password screen (`Articles`, hashed, held in `sessionStorage`).
It came down when the shop opened: prices are published, the enquiry form is live, and a
padlock in front of a working shopfront costs more in lost enquiries than it saves in
polish. See `claude/website-service-marketing-plan.md`, Phase 0.

What went with it: `#gate` and its inline script in `index.html`, the whole gate block in
`styles.css` (including `html:not(.is-unlocked) body { overflow: hidden }`), section 0 of
`js/site.js`, and the redirect stubs at the old `.html` paths.
`restoreRoute()` is now called directly from `boot()`.

If a future unfinished section needs hiding, do it on the host (Cloudflare Access in front
of the deployment) rather than in the page. A doormat in JavaScript never stopped anybody
who opened dev tools.


## The devlog

Entries live in `devlog/<YYYY-MM-DD-slug>/index.html`, one standalone page each. They are
hand-maintained — **`build.py` does not generate them** — because each carries its own
game's palette rather than the studio chrome.

**Naming.** `YYYY-MM-DD-<game>-<n>` since the second game arrived, e.g.
`2026-09-20-scuttlers-one`. The Articles entries predate that convention and keep their
original names (`2026-08-28-entry-one`, `2026-09-04-entry-two`, `2026-11-02-entry-three`)
because they are live URLs in the sitemap. Do not rename them; name everything new the
new way.

**To add an entry** (the order that avoids the mistakes made on entry three):

1. **Copy the nearest existing entry of the same game** and replace its body. That gets
   you the self-hosted `@font-face` block, the root-absolute paths, the favicon links and
   the `<main id="main">` landmark for free. Do not start from a file written elsewhere:
   the three things it will get wrong every time are Google Fonts in the head (a
   third-party request on a page somebody reads), `../assets/…` relative paths, and
   `assets/brassneck-mark.png`, which has not existed since the October rebrand.
2. **Set the canonical, the `og:title` and the title** to the new entry.
3. **Add one `<li>` to `.logs`** in that game's panel in `.build/games.part.html` —
   newest first — and update the same panel's `.meta` status line while you are there.
4. **Add a `<url>` to `SITEMAP` in `.build/build.py`**, then run the build.
5. **Audit it at 390px.** Anything `white-space: pre` inside the entry column needs
   `min-width: 0` on `.body`, or the whole page scrolls sideways on a phone.

No redirect stub is needed for a new entry. Stubs exist only to keep an *old* URL alive.

**The back link** is `<a class="back" href="/games/">` with
`/assets/logo/landscape-white.svg` inside it (`landscape-maroon.svg` on the light
Scuttlers ground).

**Contrast.** The Articles palette's `--faint` was `#5d6b76`, which is 3.3 : 1 on the
ground and 2.9 : 1 on the readout panel — it carries the kickers, the rail meta and the
whole footer, so this was most of the small text on the page. It is `#7c8b98` as of
3 Nov 2026: same hue, same saturation, lifted until 10px text clears 4.5 : 1 on both.
All three Articles entries now audit clean at three widths. **Scuttlers has not been
done** — it is a separate two-theme palette and still reports 2.9–3.3 : 1.

**Each game's devlog carries its own visual world**, not the studio's. The Articles is dark
(bone, sea slate, bilge dark, wet oak, lamp brass). Scuttlers is a photocopied school newsletter:
yellowed paper, mint corridor paint, biro blue, with a dark mode. Stepping into an entry should
feel like stepping into that game.

**Scuttlers entries use the maroon lockup** (`/assets/logo/landscape-maroon.svg`) in the back
link, swapped for the white one under `prefers-color-scheme: dark`. The white lockup is drawn
for dark artwork, so its counters knock through and the face reads as a blob on pale ground.

**Pictures live in `devlog/img/`**, referenced as `img/name.jpg` from the entry, one flat
folder shared by every entry so names have to say which entry they belong to
(`carrow-before-after.jpg`, `ships-plan.jpg`). Set `width` and `height` on every `<img>` so
the page does not jump as they load, add `loading="lazy"`, and give a figure the `.wide`
class when it should break out of the 66ch text column into the rail gutter.

## Service examples, how they work

Each card in "What we do" is a `<button data-svc="...">` that opens a native `<dialog>`.
The card lifts and scales on hover, and the dialog **grows out of the card you clicked and
shrinks back into it** on close, via the Web Animations API against the card's measured
rect. Both are disabled under `prefers-reduced-motion`.

Everything a card says — title, prices, body, the laptop's image or video, its caption and
where it opens to — lives in the `EXAMPLES` object in `js/site.js`. Nothing is in the
markup. The table of what each card shows is further down under "Service examples, what
each one shows".

**Restored 3 Nov 2026.** The redesign briefly replaced these cards with an accordion. They
came back because the cards read as clickable and the accordion did not, and because seven
cards take a third of the vertical space seven open panels do.

Opening one sends `/websites/example/<name>` to Umami, so you can see which service people
are actually curious about — useful for deciding what to write next.

Because the close is animated, the dialog's own `cancel` event and its close buttons are
intercepted (`preventDefault`) and `modal.close()` is called on `animation.onfinish`. The
video is paused there too, or it carries on playing behind a closed dialog.

**A trap that is now gone:** the global Escape handler used to walk a visitor back to the
threshold, and had to bail when `dialog[open]` matched or closing an example closed the
whole page. There is no threshold any more, so there is no handler and no guard.

## Demonstration builds

`demo/northwell/` is a complete, fictional small-business site, plus a web app and a
traffic report. Three of the seven service examples open onto it.

**Northwell Plumbing & Heating does not exist**, and every page says so in a brass band
across the top that cannot be missed. That matters: a demonstration site that could be
mistaken for a real trader is a different thing entirely, and the phone number is
`01752 000 000` for the same reason.

| Path | What it is |
|---|---|
| `demo/northwell/` | The £800 Basic tier made real: one page, no framework, no script, 12 KB |
| `demo/northwell/quote/` | A working quote calculator — the web-apps example |
| `demo/northwell/report/` | A worked monthly traffic report, invented figures |

All three carry `noindex`, deliberately. A fictional plumber ranking in Plymouth would be
worse than useless. **The `Disallow` is deliberately NOT in `robots.txt`** — a crawler has
to be able to fetch a page in order to read the `noindex` on it.

The report is self-contained rather than pulling `/css/styles.css`, because the real thing
lands in somebody's inbox and should still render correctly in five years.

## Service examples, what each one shows

Seven cards on `/websites/`, each opening a dialog with prices, an explanation, and a laptop showing
something real. `EXAMPLES` in `js/site.js` is the only place any of it is written down.

| Card | What the laptop shows | Opens |
|---|---|---|
| Web design | The old door-and-dive homepage, recorded | The demo site |
| SEO | ember8.nl | ember8.nl |
| Hosting & support | The demo site | The demo site |
| Traffic reports | The sample report | The report |
| Branding | The mark at 128 / 48 / 32 / 16 px | — |
| Graphic design | The Scuttlers devlog | The devlog |
| Web apps & installable apps | The quote calculator, running | The live app |

The web-design card is the one with motion in it, so it is a `<video>` rather than an
image: `assets/video/door.webm` (85 KB) with an `.mp4` beside it. **The same recording as
a GIF was 1.4 MB**, which is why it is not in the repo. There is no audio track at all,
which is what lets it autoplay; `preload="none"` means nothing is fetched until a card
that wants it is opened.

The seventh card runs full width under the other six (`.svc-wide`) rather than leaving an
orphan at the end of a three-column grid.

## Performance

**100 / 100 / 96 / 100 on all six brand pages** (performance, accessibility, best
practices, SEO) — Lighthouse 13, mobile emulation, three runs each, re-measured after the
3 Nov redesign. Best practices reports 96 only because the Umami script cannot be reached
from the machine the test runs on; that is an artefact of the test environment, not of the
site.

The local server used for this (`gzserve.py <dir> 8100`) **gzips its responses**, which is
what GitHub Pages does; a plain static server does not, and gives a misleadingly low
number. Lighthouse needs `CHROME_PATH` pointed at a real Chromium first.

Worth knowing before anyone claims a number publicly: **run it against the live URL first.**
`/websites/` now prints the figure as a claim, so it has to be reproducible by anyone who
runs the same tool against `brassneck.studio`.

What the original performance work was:

- **145 dead CSS rules removed**, 18 KB. Verified by pixel-diffing ten pages at two widths.
- **The images re-encoded** at the size they are displayed rather than 1600px.
- **The light bands were redefining no tokens**, so `--brass-lit` stayed at full Brass and
  the homepage step numbers sat at 2.5 : 1. Same bug class as the section pages had.
- **The site footer was inheriting `opacity: .72`** from the old per-view footnote rule,
  which pulled the company registration line to 3.6 : 1. The old rule is now scoped to
  `.shell > .foot-reg` so it cannot reach the new footer.
- **Five `<img>` tags pointed at files that have never existed** (game covers, team
  photos). An `onerror` hid them, but every page view still fetched and still logged a
  404. A fallback reached by failing is not a fallback.
- **Landmarks and heading order**: the case study and the legal pages had no `<main>`, and
  the contact page went from `h1` to `h3`.

Over the wire, with the compression GitHub Pages applies: stylesheet 19 KB, script 8 KB,
a page 4–5 KB, the full landscape lockup 33 KB.

**The fonts are now subset.** `anton-regular-sub.woff2` and
`darkergrotesque-var-sub.woff2` are what every page preloads; the full files are gone. The
failure mode that made this worth avoiding — a subset silently dropping a glyph — did
happen: neither family carries U+2605, so the review stars are **inline SVG** (`.star`,
`fill: currentColor`) rather than a character. If you add copy with an unusual glyph in
it, check it renders before trusting it.

## Pricing

Published on the Websites page, straight out of `claude/service-pricing.md`. Build tiers
**`£950 / £1,650 / Ask`** (raised from £800 / £1,500 on 2 Nov 2026), care plans
`£20 / £60 / £100` a month, and **hosting included for the first twelve months on every
build** (which is the free year of Lights On, and the mechanism that gets every client
onto a plan). Education and charity work is quoted below these.

Three things to hold to when editing these numbers:

- **£1,650 is deliberately below the UK band** (£2,000-£5,000 for a brochure site) because
  there is one case study and one testimonial, so price is still doing work that proof
  cannot. **Review after the third paid build.**
- **Care and Partner are sold from day one**, not from month thirteen. The included year
  covers the Lights On layer only. If the free year quietly grows to include content edits
  there is no upgrade left to sell.
- **A price appears in more than one place.** The Websites page, the Apps page, the
  homepage closer, the service modals, the meta descriptions in `build.py`, and
  `claude/service-pricing.md`. Grep the whole repo for the old figure before declaring a
  change done.

Markup is `.rate-row` on `/websites/` (the three tiers as rows, not columns) and the
pricing block inside each service modal. `/apps/` carries its own `.svcs` grid.

## The brand system

**Rebranded 26 Oct 2026** to the identity delivered by James Smith Design. The guidelines PDF in
`~/Documents/Brassneck/Brassneck Studio Final Files/` is the source of truth; `claude/brand-identity.md`
in the project summarises it.

### Four colours, and the rule about them

| Token | Value | Role |
|---|---|---|
| `--brass` | `#C48E42` | the accent, and the closing CTA band |
| `--maroon` / `--ink` | `#280700` | the page ground |
| `--black` | `#0C0C0C` | recesses and voids only |
| `--white` / `--paper` | `#F1EFEC` | text |

**Everything else in `:root` is one of those four, one of them at reduced alpha, or two of them
mixed.** No fifth hue enters the system. The surface ramp (`--surface`, `--surface-hi`, the timber
tones, the brass metal shading) is all Dark Maroon or Brass moved toward White or Black.

There are **two documented departures**, both marked in the CSS where they occur:

1. **`--warn: #D98166`** for form validation. The palette has no red, and an error that is
   indistinguishable from the accent colour is a usability defect. This is the Dark Maroon hue
   lifted until it reads as red, at 6.5 : 1 on the ground.
2. **`--brass-edge` / `--brass-glint`** exist only to light metal (the door furniture and casings).
   They are Brass mixed with Black and with White, never used as flat colour.

Text contrast on the ground is **16.3 : 1** (`--paper`), **10.1 : 1** (`--dim`) and **6.0 : 1**
(`--muted`). Brass on the ground is 6.5 : 1.

**White on brass is 2.5 : 1 and fails.** Anything sitting on a brass fill — the CTA band, the
"most people want this one" flag, brass buttons — takes Dark Maroon or Black text. This is the one
contrast trap in the palette and it is easy to walk into.

### Typefaces

| Family | File | Used for |
|---|---|---|
| **Anton** | `anton-regular.woff2` | display, **all caps**, one weight |
| **Darker Grotesque** | `darkergrotesque-var.woff2` | everything else, variable 300-900 |

Both converted from the supplied TTFs with fonttools. Archivo and Spectral are **gone** from the
studio side; `archivo-var.woff2` and the five `spectral-*.woff2` files are now dead weight in
`assets/fonts/` and can be deleted.

Two things that will bite if forgotten:

- **Anton ships one weight.** Every rule that uses it pins `font-weight: 400` and
  `font-synthesis-weight: none`. Asking a single-weight face for 700 makes the browser smear a
  synthetic bold onto it, which on a face this heavy turns to mud.
- **Darker Grotesque's variable default is 300**, which is too light to set body copy in. `body`
  sets 500 explicitly. **No rule may rely on `font-weight: normal`.**

Headings stay sentence case in the HTML and are uppercased in CSS, so the markup still reads
properly and the decision is one line to undo. The display set is defined in a block at the **end**
of `styles.css`, which overrides the component rules above it by order — put new display selectors
there, not inline.

### The logo

`assets/logo/`, six SVGs: Icon and Landscape in Brass and White, Landscape in Dark Maroon, Portrait
in White. Straight from the delivered files, unaltered.

**The usage rules are strict and the old site broke two of them.** The logo appears only as
Landscape or Portrait; the icon may appear alone; **the wordmark may never appear without the
icon**. The old masthead set "Brassneck STUDIO" in Archivo beside the mark, which is recreating the
wordmark in type.

The masthead is now **the Icon alone** (`icon-white.svg`), sized by height via `.lockup`
(46px desktop, 32px on the doc back links, 38/28px under 560px). The icon standing alone is
explicitly permitted. The full Landscape lockup is no longer used in the chrome.

The fills are hard-coded in each file (`.cls-1 { fill: … }`), not `currentColor`, so **a colourway
is changed by swapping the `src`, not from CSS.** That is deliberate: editing the file would be
altering the logo.

`favicon.png`, `apple-touch-icon.png` and `og-card.png` are generated from these by
a Playwright rasteriser. **The icon is portrait (332.92 × 461.02), so tiles must be sized by
height** or the feet get clipped. It holds at 16px, so no separate favicon glyph is needed.

### The particle hero (retired, 27 Oct 2026)

The old homepage sampled the real wordmark out of `landscape-white.svg` into a particle
field. It went with the rest of the homepage when direction C replaced it, and with it
went the one open brand question on this site: the guidelines say the wordmark may not
appear without the icon, and a hero made of the lettering alone was a judgement call.
Nothing on the site now shows the wordmark except the full lockup in the footer, so the
rule is satisfied outright rather than argued about.

The technique is worth keeping a note of in case it is ever wanted again: the character
was dropped **by measured geometry, not by path index** — the parsed SVG appended
off-screen but laid out (`getBBox()` returns zeroes on a node that was never laid out),
each path measured, and any path whose right edge fell left of `0.40 × viewBox width`
discarded. Index-based selection would have broken silently on a re-export.

### The plane system (the six brand pages)

**3 Nov 2026.** The six generated pages are built from **full-bleed colour planes**, one
per idea, stacked down the page: `section.plane.p-maroon`, `.p-white`, `.p-black`,
`.p-brass`. A plane runs edge to edge; its content sits in a `.plane-in` capped at
`--plane-max` (1600px) and left-padded by `--logo-col` so **nothing ever shares the
x-axis with the masthead mark** — that was Oliver's note on the first preview, and the
padding is the fix, so keep it on anything new.

| Page | Planes, top to bottom |
|---|---|
| `/` | maroon · white · black · brass |
| `/websites/` | maroon · white · black (the Hoe/Lighthouse block) · maroon |
| `/apps/` | maroon · white · brass |
| `/studio/` | maroon · white · brass |
| `/contact/` | maroon · white |

The masthead is transparent and blurred, and its mark changes colourway as a plane edge
wipes through it — `initMastTone()` in `js/site.js` probes with `elementsFromPoint` and
clips one of two stacked `<img>`s. **Colourways are swapped by `src`, never recoloured in
CSS**, which is the brand rule.

`/games/` kept the **legacy band system** below the divider in `styles.css`, because
Oliver asked for the old Games page back and it was fine as it was.

### Section tones (legacy — `/games/`, the case study, the legal pages)

The ground is Dark Maroon throughout, which on a long page reads as one flat note. Sections
alternate: `section.band.tone-white`, `.tone-black` and `.tone-brass` paint inset blocks in the
palette.

**A tone does not restyle components. It redefines tokens.** Each tone class sets `--paper`,
`--dim`, `--muted`, `--rule`, `--hairline`, `--brass-lit`, `--brass-dim`, `--surface` and
`--surface-hi` on the section, and every component rule inside inherits the right colour without
knowing it is in a toned band. Adding a new component needs no tone-specific CSS; adding a new tone
needs no component changes.

Two tokens are deliberately **not** redefined:

- **`--ink`** is the text colour printed *on* brass fills, so it must stay Dark Maroon everywhere.
- **`--brass`** stays the literal brass for fills and metal. Brass-as-*text* is `--brass-lit`
  instead, which a tone can darken — on White it becomes `#684D27` (brass at 50% toward black,
  6.8 : 1) because brass on white is 2.5 : 1 and fails. All 27 brass text declarations use
  `--brass-lit`; the handful of brass-text-on-dark-button rules are pinned back to `--brass`, as is
  `.crew-initial`, which sits on a dark tile inside a white band.

Current placement: 4 toned bands on `/games/`, 2 white and 1 black on the Ember8 case study.
**The Contact page has no light ground behind the form** — inverting every form control
costs more than it gains, so the form stays on maroon. Devlogs keep their own game palettes
entirely; only the studio back-link logo changed.

**The tokens the tones redefine are also declared on `:root`.** They were not, at first,
and the legal pages — which are outside every tone block — lost every border on the day
the stylesheet was rebuilt. If you add a token that a tone redefines, give it a
dark-ground default at the top of the file as well.

A contrast audit over every page (`contrast.mjs` in the scratchpad) comes back clean. The only
reported failure is `.nameplate`, a false positive: dark text on a brass *gradient* the audit cannot
parse.

## Legal pages

`legal/privacy/` and `legal/terms/`, same `body.doc` pattern as the case studies.
Linked from a `.foot-legal` row in every footnote (Privacy / Cookies / Terms), plus a
`.f-privacy` line under the contact form, plus the statutory company disclosure in
`.foot-reg` on the homepage.

**Both pages carry the registered details and both have to change together** if the company
name, number or registered office ever changes: Brassneck Studio Ltd, company number
17431166, registered in England and Wales, registered office 4 Earls Acre, Plymouth,
PL3 4HL. A limited company is legally required to show all four on its website.

**The cookies position, because it is the unusual bit.** This site sets no cookies at all
and writes nothing to the visitor's device, so there is no banner and no consent to collect.
Umami is cookieless; the only thing it touches is a *read* of `localStorage["umami.disabled"]`,
the switch used to keep our own visits out of the numbers, and the privacy page says so
explicitly rather than claiming the script touches nothing. **If anything is ever added that
does set a cookie or write to storage — a chat widget, an embedded video, an ads pixel,
Google Analytics — that position collapses and the site needs a real consent banner.** Adding
one is a much bigger job than adding the tag, so price it in before agreeing to it.

The third parties named in the privacy table are the real ones and the list is exhaustive:
Umami, Formspree, GitHub Pages, Google Fonts, Zoho. Anything added to the site gets a row.

See `claude/legal-pages-and-compliance.md` for the two open compliance items.

## Case studies

`work/*.html`, one standalone page each, same pattern as the devlog: real URL, `.doc-back`
link home. (These pages used to need an `is-unlocked` class on `<html>` to scroll at all,
because the gate stylesheet held `<body>` still until the password was passed. That rule
went with the gate.) They use the **studio** stylesheet (`../css/styles.css`)
via `body.doc`, unlike devlog entries, which carry the game's palette.

The Websites page shows a **preview card** (`.study`) linking to the full page — deliberately
one client, not a list. Not every client wants their site written about, and a grid of logos
is a promise you cannot always keep. New case study = new file in `work/`, new `.study` card.

## The mark

`assets/brassneck-mark.png` is a transparent PNG, keyed out of Oliver's dark-ground
artwork. The counters (eyebrows, eye, mouth, the gap under the ring) were drawn in the
same ink as the background, so keying the dark out leaves those knocked through: on any
dark surface the mark reads exactly as drawn, and it is not stuck to one background colour.

`brassneck-mark-light.png` is the white-ground variant, kept for print and for anything on
a pale surface. `favicon.png` and `apple-touch-icon.png` are the mark composited back onto
the ink square, since a browser tab needs a solid shape rather than a transparent one.

Referenced as an `<img class="mark">` in five places on `index.html`, plus the case study
and the devlog back links, sized by CSS height (48px masthead, 22-26px on the back links).

**Known limitation, worth deciding on before launch:** this mark carries facial detail and
does not survive 16px. At favicon size it reads as a brass blob. The previous abstract mark
was chosen partly because it held its silhouette that small (see `brand-identity.md`). If
the tab icon matters, the answer is a separate simplified glyph for 16-32px, not a smaller
render of this one.

## House style

**No em dashes.** They were swept out of every user-facing file and each one rewritten for
its own sentence rather than swapped blind, so nothing turned into a comma splice. Use a
colon, a full stop, brackets or a comma instead. Worth a grep before any commit:

```
grep -rn "—" index.html work/ js/
```

## Voice

Marketing pages (Websites, Contact, case studies) speak as **we**. The devlog speaks as
**I** — it is one person's log and self-deprecation needs a self. Keep that split; it is
deliberate rather than an oversight.

## The Studio page

`#page-studio`. It exists to answer one objection out loud: *a studio that does websites
and games probably does neither properly*. Naming the doubt is more persuasive than
avoiding it, so the h1 is "Concerns? Meet the team."

Three moves, in order:

1. **The team.** Four people, four roles. Each one-liner is written to show the *transfer*,
   not the biography, because the transfer is the argument.
2. **Same skill, two rooms.** A six-row table with the website version on the left, the
   discipline in the middle, the game version on the right. This is the actual proof.
   Add rows by copying a `.xfer`.
3. **The punchline.** "We have the skills to do both. So we had the audacity to do both,"
   followed by the dictionary gloss of *brassneck*, which is what lands the name.

Portraits are optional and follow the same pattern as everywhere else: each looks for
`assets/team-<name>.png` and falls back to a brass initial if the file is not there.

Like Contact, Studio routes by fade rather than by door.

**Reaching it from the threshold:** `.why-both`, a small brass plaque reading "Why both?"
hung on the wall between the two doors, with hairlines running off toward each. It is a
sibling of `.stage` rather than a flex child of it, absolutely positioned, so adding it does
not push the doors apart. Below 900px the doors are too close together to hang anything
between them, so it drops underneath and centres. It stays `position: relative` there
rather than `static`, because `.floor` is absolutely positioned over that part of the
section and would otherwise paint on top of it.

**The four one-liners are drafts.** They describe how each role carries across rather than
making claims about anyone's history, but they are words put in real people's mouths on a
public page. Get them read before launch.

## The contact form

`#page-contact`. Live since 3 Sep 2026:

```js
const FORM_ENDPOINT = "https://formspree.io/f/maeybwaz";   // js/site.js
```

If that endpoint is ever cleared back to a `YOUR_FORM_ID` placeholder the form still
validates and still works: submitting opens a pre-filled email to `FALLBACK_EMAIL` instead
of pretending to send. It never silently swallows an enquiry.

Submission is `fetch` with `Accept: application/json`, per Formspree's own AJAX pattern —
success is `response.ok`, and a failure reads `errors[].message` out of the JSON body. On
success the whole form is replaced with a confirmation panel and `/contact/sent` is sent
to Umami, so the conversion rate is visible without any extra setup.

There is a `_gotcha` honeypot field, hidden off-screen. Formspree discards submissions
that fill it; the JS bails on it too, so it works either way.

## The service reel

The rolling list on the Websites page (`REEL` in `js/site.js`). The rotating word is set
larger than the "We do" lead-in (`.reel-lead` is `.58em` of the line size) so the service is
the thing that reads, not the verb. Words are plain strings
— add, remove or reorder freely; the brass rule underneath measures each word and animates
to its width, so nothing needs adjusting when the list changes. It re-measures on resize
and after webfonts load.

It stops when the tab is hidden or when you are not on the Websites page, so it is not
burning a timer in the background. Words are set in sentence case in the JS and uppercased
in CSS (`text-transform`), so the source stays readable and the accessible label on
`.reel-line` reads as a normal sentence to a screen reader.

## The character select

Top right of the Games page head, on the same line as the h1. Deliberately small: the
**trailer** is what should be on screen when the page loads, and the roster is a signpost
pointing at it, not the event. If you enlarge the slots, check the trailer still opens above
the fold at 900px tall before you commit.

Slots are `<button>`s. Clicking a locked one swaps the trailer for its `data-quip` line;
clicking The Articles (or "Back to The Articles") swaps it back. That is why the quips are
no longer printed on the cards — they are the reward for poking a locked slot.

Page order on Games: header and roster, then the **trailer slot** (the video), then the
trailer copy underneath it, then the blurb, devlog and release.

The slot breaks out of the 1140px shell and takes `min(94vw, 1720px, 74vh x 16/9)` — about
1210 x 680 on a 1440 x 950 screen. It uses 94vw rather than 100vw on purpose: the page is
its own scroll container, so a true 100vw block gives it a horizontal scrollbar.

`initTrailerScroll()` scales the **slot itself** (not the whole stage) between 0.84 and 1.0
with a smoothstep curve, driven by how near its centre is to the middle of the viewport.
Opacity rides along from 0.66 to 1. It sits at about 0.97 on load, peaks a scroll-notch
later, then falls away, which is what makes the movement readable rather than a wobble.
Disabled entirely under `prefers-reduced-motion`.

**To add the cover art:** drop a portrait image at `assets/articles-cover.png`. Nothing
else to change — the `<img>` is already there with `onerror="this.remove()"`, so until the
file exists it deletes itself and the placeholder shows through. That does mean a 404 in
the console until you add it, which is deliberate: it is the cheapest possible reminder.

Unlocking a slot later = swap `is-locked` for `is-unlocked`, replace the padlock SVG with
an `<img>`, fill in the name. The greyed-out look is `filter: grayscale(1)` plus opacity,
so a locked slot with real art in it would still read as locked.

## Where to change things

**Colours and type scale** — the `:root` block at the top of `styles.css`. Everything
else reads from those tokens, so changing `--brass` there changes it everywhere.

**Page copy** — `.build/<page>.part.html`, never the `index.html`. See the warning at
the top of this file.

**The `h-` prefix is still load-bearing.** Classes carrying it (`.h-builder`, `.h-hoe`,
`.h-u-draft`) came from the old homepage, which used generic names the section pages
already use for different components. Two survivors are live: the **builder animation**
on the homepage and the **Lighthouse / Smeaton's Tower** block on `/websites/`. Do not
rename them, and prefix anything you add alongside them.

**The builder animation** — one 20-second clock, five four-second beats, at the end of
`styles.css`. Every part of it (the layers, the captions, the pointer, both states of the
address bar) runs on that same clock with a four-second offset per beat, so nothing can
drift out of step. Reduced motion is switched off by hand there rather than inherited,
because the global reset crushes durations to a millisecond, which would leave all five
layers stacked on top of each other.

**The mark's idle motion** — `@keyframes idle` and `hop`, under
`prefers-reduced-motion: no-preference`. It is a rotate-and-lift on the `<img>`, transforms
only: the artwork is never altered, which is what keeps it inside the brand rules. The
proper animated ident from James is a separate, still-outstanding job.

**Dead CSS** — there is some, roughly 6.6 KB uncompressed. **Do not run a scripted
prune.** Three separate attempts in this repo have deleted live rules: the last would have
taken `.h-u-draft`, which is on screen in the builder's address bar. If it ever matters,
use a real CSS parser and pixel-diff every page at three widths.

**Where the old door machinery went** — deleted. The recording of it is
`assets/video/door.webm`, played inside the Web design example. If it is ever wanted back,
it is in the git history up to the commit before 27 Oct 2026.

## Known gaps

- **The animated ident.** James's reference clip is 115 × 154 native, too small to upscale
  and use. The sway on the mark is done in CSS instead; the blink is not done at all. Needs
  a usable export.
- **The Studio page has no team photographs.** The initials fallback stands on its own.
- **No game cover art.** `assets/articles-cover.png` is still absent, so the `<img>`
  deletes itself via `onerror` and logs a 404 — deliberately, as the cheapest reminder.
- **The Scuttlers devlog entry and `demo/northwell/` carry contrast failures** (2.9–3.3 : 1
  and 4.45 : 1). They run their own palettes, outside the brand tokens, so the brand
  pages' clean audit does not cover them. The three Articles entries were fixed on
  3 Nov — see "The devlog" below.
- **The Lighthouse claim on `/websites/` is from the local gzipped server**, not the live
  URL. Re-measure against `brassneck.studio` once deployed.
- Ember8's outcome line is blocked on Umami numbers.
- **The `/apps/` prices (£1,200 / £900) have never been sold at.** £1,200 is a floor
  derived from the £60/hr house rate, not from a real job. Revisit after the first one.
