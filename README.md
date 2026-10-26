# Brassneck Studio — the site

A particle wordmark and magnetic body text that answer to the cursor, two doors that open
and dive through to Websites and Games, and behind them the real pages: services, prices,
a case study, the studio, the devlog, and a working enquiry form.

## Run it

1. Drop this whole `brassneck-site` folder anywhere in Finder.
2. Open the folder in VS Code (**File → Open Folder**, pick `brassneck-site` — not the file).
3. Right-click `index.html` in the sidebar → **Open with Live Server**.

Live Server matters here: `threshold.js` reads pixel data back out of a canvas
(`getImageData`) to build the particle wordmark. Opening `index.html` straight from
Finder uses the `file://` protocol, where that read is blocked as a cross-origin
violation and the wordmark comes out blank. Serving over `http://` fixes it.

If you don't have it: VS Code → Extensions → search "Live Server" (Ritwick Dey).


## The preview gate (removed, 3 Sep 2026)

The site used to open on a password screen (`Articles`, hashed, held in `sessionStorage`).
It came down when the shop opened: prices are published, the enquiry form is live, and a
padlock in front of a working shopfront costs more in lost enquiries than it saves in
polish. See `claude/website-service-marketing-plan.md`, Phase 0.

What went with it: `#gate` and its inline script in `index.html`, the whole gate block in
`styles.css` (including `html:not(.is-unlocked) body { overflow: hidden }`), section 0 of
`threshold.js`, and the redirect scripts at the top of `work/*.html` and `devlog/*.html`.
`restoreRoute()` is now called directly from `boot()`.

If a future unfinished section needs hiding, do it on the host (Cloudflare Access in front
of the deployment) rather than in the page. A doormat in JavaScript never stopped anybody
who opened dev tools.

## Files

```
index.html            all three views — home, websites, games
css/styles.css        design tokens at the top, then components in page order
js/threshold.js       particles, magnetic text, the door/dive sequence, routing
assets/               the mark (PNG, transparent), favicon and touch icon
devlog/               one file per entry, each a standalone page
work/                 one file per case study, each a standalone page
```


## The devlog

Entries live in `devlog/`, one standalone HTML file each, named `YYYY-MM-DD-*.html`. They
are **not** part of the single-page app — each is a real page with a real URL, because a
devlog entry is the one thing on this site somebody might link to directly.

Each entry keeps *The Articles*' own palette (bone, sea slate, bilge dark, wet oak, lamp
brass) rather than the studio's. That is deliberate: stepping into an entry should feel
like stepping into the game's world, not reading a studio blog post about it.

**Naming.** `YYYY-MM-DD-<game>-<n>.html` since the second game arrived, e.g.
`2026-09-20-scuttlers-one.html`. The two Articles entries predate that convention and keep their
original names (`2026-08-28-entry-one.html`, `2026-09-04-entry-two.html`) because both are live
URLs and are in the sitemap. Do not rename them; name everything new the new way.

**To add an entry:** drop the new file in `devlog/`, copy the `.back` link from the existing
entry, then add one `<li>` to `.logs` **in that game's own panel** in `index.html`. Newest first,
and update the build or milestone in the same panel's `.meta` list while you are there. Add a
`<url>` to `sitemap.xml` too.

**Each game's devlog carries its own visual world**, not the studio's. The Articles is dark
(bone, sea slate, bilge dark, wet oak, lamp brass). Scuttlers is a photocopied school newsletter:
yellowed paper, mint corridor paint, biro blue, with a dark mode. Stepping into an entry should
feel like stepping into that game.

**Scuttlers entries use the light-ground mark** (`brassneck-mark-light.png`) in the back link,
swapped for the standard one under `prefers-color-scheme: dark`. The standard mark is keyed out of
dark artwork, so its counters knock through and the face reads as a blob on pale ground. It is also
set at 28px rather than 20px there, because the mark does not survive much below 30 (see
`brand-identity.md`).

Every entry needs **the `.back` link** pointing at `../index.html#games`, see routing below.

**Pictures live in `devlog/img/`**, referenced as `img/name.jpg` from the entry, one flat
folder shared by every entry so names have to say which entry they belong to
(`carrow-before-after.jpg`, `ships-plan.jpg`). Set `width` and `height` on every `<img>` so
the page does not jump as they load, add `loading="lazy"`, and give a figure the `.wide`
class when it should break out of the 66ch text column into the rail gutter.

## Service examples

Each card in "What we do" is a `<button data-svc="...">` that opens a native `<dialog>`.
The card lifts and scales on hover, and the dialog **grows out of the card you clicked and
shrinks back into it** on close, via the Web Animations API against the card's measured
rect. Both are disabled under `prefers-reduced-motion`.
Copy lives in the `EXAMPLES` object in `threshold.js` — title, image path, placeholder
caption, and HTML body. Every example is drawn from real work (mostly Ember8), not invented.

Screenshots are optional: each looks for `assets/example-<name>.png` and falls back to a
captioned placeholder panel if the file is not there. Drop the images in and they appear.

Opening one sends `/websites/example/<name>` to Umami, so you can see which service people
are actually curious about — useful for deciding what to write next.

Because the close is animated, the dialog's own `cancel` event and its close buttons are
intercepted (`preventDefault`) and `modal.close()` is called on `animation.onfinish`.

**One trap worth knowing:** the global Escape handler that walks a visitor back to the
threshold has to bail when `dialog[open]` matches. Without that guard, closing an example
with Escape also closed the whole page.

## Pricing

Published on the Websites page ("What it costs"), straight out of
`claude/website-service-marketing-plan.md` §3. Build tiers `£800 / £1,500 / Ask`, care
plans `£20 / £60 / £100` a month, and **hosting included for the first twelve months on
every build** (which is the free year of Lights On, and the mechanism that gets every
client onto a plan).

Two things to hold to when editing these numbers:

- **£1,500 is deliberately below the UK band** (£2,000-£5,000 for a brochure site) because
  there are two case studies and no testimonial yet, so price is doing the work proof
  cannot. **Review after the third paid build. £1,950 is the next stop.**
- **Care and Partner are sold from day one**, not from month thirteen. The included year
  covers the Lights On layer only. If the free year quietly grows to include content edits
  there is no upgrade left to sell.

Markup is `.tiers` / `.tier` (the middle one carries `.is-pick` and the brass flag) and
`.plans` / `.plan`, both in `#page-websites`. Both collapse to one column under 900px.

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

### The particle hero

The homepage canvas used to typeset BRASSNECK and sample the letterforms. That broke the new rules
twice: the wordmark must not be recreated, and Anton must not be used to imitate it. It now forms
**the real lettering**, taken from `assets/logo/landscape-white.svg` — the actual artwork, never
type standing in for it. Fetched rather than drawn through an `<img>` so no canvas-tainting
question arises, and so the file on disk stays the only copy of the artwork.

The character is dropped **by geometry, not by path index**: the parsed SVG is appended off-screen
(`position:absolute; left:-9999px`, laid out but invisible, because `getBBox()` returns zeroes on a
node that was never laid out), each path measured, and any path whose right edge falls left of
`0.40 × viewBox width` discarded. That is the character. The eleven lettering paths are handed to
`Path2D` and filled into an offscreen canvas, which is then sampled for particle targets. Index-based
selection would silently break if the file were ever re-exported with a different path order.

**Note the brand-rule tension:** the guidelines say the wordmark may not be used without the icon.
The homepage masthead carries the icon on the same screen, which is the reading this is built on, but
it is a judgement call and not something the PDF spells out.

If the fetch fails the hero is simply empty; nothing else depends on it.

### Section tones

The ground is Dark Maroon throughout, which on a long page reads as one flat note. Sections now
alternate: `section.band.tone-white`, `.tone-black` and `.tone-brass` paint inset blocks in the
palette, the same move as the brass closer band on the Websites page.

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

Current placement: 5 white and 3 black bands on the homepage, 2 white and 1 black on the Ember8 case
study. **The Contact page has no toned band** — a light ground there would mean inverting every form
control, and the dark form is the better-looking option. Devlogs keep their own game palettes
entirely; only the studio back-link logo changed.

A contrast audit over every page (`contrast.mjs` in the scratchpad) comes back clean. The only
reported failure is `.nameplate`, a false positive: dark text on a brass *gradient* the audit cannot
parse.

## Legal pages## Legal pages

`legal/privacy.html` and `legal/terms.html`, same `body.doc` pattern as the case studies.
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
const FORM_ENDPOINT = "https://formspree.io/f/maeybwaz";   // js/threshold.js
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

The rolling list on the Websites page (`REEL` in `threshold.js`). The rotating word is set
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

## Routing

The homepage is a single page that swaps views, but `#websites`, `#games` and
`#contact` are real addresses. Landing on one — from a devlog's back link, or a shared link — calls
`showInstant()`, which puts you on the page with no dive. **The dive is the reward for
choosing a door, not a toll on every visit.** Diving sets the hash via `history.replaceState`;
coming home clears it.

`restoreRoute()` runs from `boot()`, once the fonts have settled, so a deep link lands
directly on its page with the title and the Umami view already set.

**Contact and Studio have no door, and never fire one.** There are two doors on the threshold and that
is the whole idea — a third would dilute it. both route through `fadeTo()` /
`fadeHome()` rather than `diveTo()` / `backOut()`, in **both** directions: arriving at the
contact page and leaving it are fades. Firing the door animation off a form page reads as
decoration rather than as going somewhere.

The door is reserved for: threshold → Websites/Games, and Websites ↔ Games.

## The tuning panel

Only on the threshold. `markRoute()` stamps `data-route` on `<html>` and CSS hides `.tuner`
anywhere else, because the sliders only control the particle wordmark, which only exists on
the home page. Delete the panel before this goes live.

## Where to change things

**Colours and type scale** — the `:root` block at the top of `styles.css`. Everything
else reads from those tokens, so changing `--brass` there changes it everywhere.

**Particle behaviour** — the `cfg` object near the top of `threshold.js`:

```js
const cfg = { density: 4, radius: 130, force: 1, speed: 1, dust: true, magnetic: true };
```

The tuning panel in the bottom-right corner writes to this same object live. Play with
the sliders, find numbers you like, then paste them into `cfg` as the new defaults and
delete the panel (`<details class="tuner">` in `index.html`, plus its `.tuner` styles and
the `bind(...)` calls at the bottom of the JS).

**Dive timing** — the constants `LEAF / LEAD / FLY / FADE` above `diveTo()`, and the
sequence at 1× speed:

| t (ms) | step |
|---|---|
| 0 | scroll locked, leaf swings open to 108° (720ms) |
| 400 | camera scales the real scene about the real aperture (900ms) |
| 580 | leaf faces fade out — you are past the door, it is behind you |
| 1300 | `transitionend` — the doorway now fills the screen; page fades onto it (420ms) |
| 1760 | camera stood back down behind the opaque page; focus to the back link |

The 108° swing and the leaf fade are both load-bearing. At a narrower angle the open
leaf sits just outside the aperture's edge and stays in frame for the whole flight, then
vanishes at the swap — which reads as a glitch, not a camera move. The overshoot on the
scale (`* 1.26`) does the same job for the casing: it clears the frame well before the
end rather than exactly at it.

There is no stand-in element and no cross-fade between two copies of the doorway. The
thing filling the screen at the end of the flight *is* the aperture you clicked, scaled
about its own centre — so there is nothing to keep in register and nothing that can
drift. The swap waits on `transitionend`, not a timer, with a timeout only as a guard
against a dropped event.

`section.roster-band` and `section.trailer-band` are written with the element prefix on
purpose: plain `.roster-band` (0,1,0) loses to `section.band` (0,1,1) and the border-top
override silently does nothing. Watch for that pattern anywhere in this stylesheet.

Two things to leave alone unless you know why they're there: the scroll lock plus
`scrollbar-gutter: stable` on `html` (without the gutter, hiding the scrollbar mid-flight
shifts the whole layout ~15px), and the absence of `isolation`, `filter`, `opacity` or
`overflow` on `.door` and its ancestors — any of those silently forces
`transform-style: flat` and collapses the 3D leaf into a 2D squash. The opacity fade is
applied to `.leaf-front` / `.leaf-back` / `.leaf-edge` individually for exactly this
reason: they are leaf nodes, so fading them is safe; fading `.leaf-wrap` would flatten
the whole thing.

Also deliberate: `.door` takes its width from `calc(var(--leaf-h) * 0.44)` rather than
`aspect-ratio` with `width: auto`. As a flex item that combination resolves late in
WebKit, and the doors render at zero width until something forces a relayout — which is
why they only appeared on hover. ### The leaf is never *still* inside a 3D rendering context

This one took four attempts, so it is worth stating precisely. The failure was: the doors
render blank (WebKit) whenever `.leaf-wrap` sits in a `transform-style: preserve-3d`
context and nothing is animating. It paints fine *while moving*, and blanks the moment it
comes to rest. Everything else was a symptom.

The rule the code now follows: **`preserve-3d` exists only while the leaf is in motion.**

| state | leaf-wrap | how it looks |
|---|---|---|
| shut | flat, no transform | ordinary 2D panel |
| teased (hover / focus) | flat, `rotateY(±7deg)` under `.door`'s `perspective` | genuinely cracked open |
| swinging / open | `preserve-3d`, `rotateY(±108deg)`, back + edge visible | a solid door |
| shut again | flat, no transform | ordinary 2D panel |

The tease is a *flat* element given a 3D rotation by the parent's `perspective` — the
standard card-flip construct, not a 3D scene. Its size is `--tease` on `.door` (16°), and
how dramatic it looks depends as much on `.door`'s `perspective` (620px — a short lens for
a 150px-wide door) and its `perspective-origin`, which is set behind the hinge on each side
so the free edge swings out toward the viewer rather than rotating on the spot. The tease
runs at 400ms via `.door:not(.is-live) .leaf-wrap`; the full 720ms belongs to the dive. `.door` carries `perspective: 900px`; nothing
above it is a 3D context any more (the old `preserve-3d` chain through `.threshold`,
`.stage` and `.portal-btn` is gone). `preserve-3d` is added by JS (`wake`) at the start of
a dive and torn down by `shutFlat` the moment the leaf is out of shot.

`shutFlat` snaps the leaf closed with `transition: none` rather than animating it. That is
deliberate: a compositor-driven transform transition on the leaf does **not** survive
`#camera`'s layer being torn down at the end of the dive — it strands the leaf mid-swing,
permanently. Since the leaf is faded out (`.is-through`) whenever `shutFlat` runs, the snap
is never seen.

Two smaller hazards removed at the same time, both inside what used to be the 3D subtree:
`.leaf-edge` was rotated exactly `90deg` (a degenerate, zero-area matrix — now `89.6deg`),
and `.sill` used `filter: blur()` (filters inside a 3D context are a known rasterisation
hazard — the same softness now comes from a radial gradient).

**Door copy and page content** — plain HTML in `index.html`: `#camera` holds the
homepage, `#page-websites` and `#page-games` are the two sections. Case study cards use
the six-step template; anything still missing is marked with `class="want"` and renders
in muted italic, so the gaps are visible on the page rather than hidden in a to-do list.

## Known gaps, deliberately

- Views swap in place rather than being real pages. For the Astro build these become
  `/work` and `/games` with the View Transitions API running the same phases, so the dive
  survives a direct link and the back button.
- The Games page footage slot is empty. Twenty seconds of *Articles* is the one thing
  that page needs.
- Ember8's outcome line is blocked on Umami numbers; Aura's is blocked on agreeing with
  the client what gets measured.
- The dive is untested on touch devices.
