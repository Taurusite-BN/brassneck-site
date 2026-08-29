# Brassneck Studio — threshold prototype

Homepage prototype: a particle wordmark and magnetic body text that answer to the cursor,
and two doors that open and dive through to the Work and Games pages.

## Run it

1. Drop this whole `brassneck-site` folder anywhere in Finder.
2. Open the folder in VS Code (**File → Open Folder**, pick `brassneck-site` — not the file).
3. Right-click `index.html` in the sidebar → **Open with Live Server**.

Live Server matters here: `threshold.js` reads pixel data back out of a canvas
(`getImageData`) to build the particle wordmark. Opening `index.html` straight from
Finder uses the `file://` protocol, where that read is blocked as a cross-origin
violation and the wordmark comes out blank. Serving over `http://` fixes it.

If you don't have it: VS Code → Extensions → search "Live Server" (Ritwick Dey).


## The preview gate

The site opens on a password screen. Password: **Articles**. Unlocking is remembered for
the browser tab (`sessionStorage`), so a refresh does not ask again; closing the tab does.

**Be clear about what this is.** It is a doormat, not a lock. The whole site is still in
`index.html`, so anyone who opens dev tools, disables JavaScript, or reads view-source can
walk straight past it. The password itself is stored as a SHA-256 hash rather than in
plain text, which stops a casual glance at the source revealing it — but a word like
"Articles" would not survive a dictionary attack, and that is not the point. The point is
that a stranger who lands on the URL sees "in construction" and stops.

**Before this goes on a real domain, put real access control on the host, not in the
page.** On Cloudflare Pages that means Cloudflare Access in front of the deployment —
Cloudflare's own docs point to it for exactly this case. It authenticates before any HTML
is served, so the unfinished site never reaches an unauthorised browser at all. The gate
in this repo can stay as a belt-and-braces layer or be deleted at that point.

To change the password, hash the new one and replace both constants at the top of the
gate section in `js/threshold.js`:

```
echo -n "NewPassword" | shasum -a 256
```

`GATE_FNV` is a non-cryptographic fallback used only when `crypto.subtle` is unavailable
(a page served over plain HTTP from a LAN IP rather than localhost). Regenerate it too, or
drop the fallback if you only ever serve over HTTPS or localhost.

## Files

```
index.html            all three views — home, websites, games
css/styles.css        design tokens at the top, then components in page order
js/threshold.js       particles, magnetic text, the door/dive sequence, the gate
assets/               the mark, used as the favicon
devlog/               one file per entry, each a standalone page
```


## The devlog

Entries live in `devlog/`, one standalone HTML file each, named `YYYY-MM-DD-*.html`. They
are **not** part of the single-page app — each is a real page with a real URL, because a
devlog entry is the one thing on this site somebody might link to directly.

Each entry keeps *The Articles*' own palette (bone, sea slate, bilge dark, wet oak, lamp
brass) rather than the studio's. That is deliberate: stepping into an entry should feel
like stepping into the game's world, not reading a studio blog post about it.

**To add an entry:** drop the new file in `devlog/`, add the two lines it needs at the top
(the session-gate script and the `.back` link — copy them from the existing entry), then
add one `<li>` to `.logs` in the Games section of `index.html`. Newest first.

Two things every entry needs:

- **The gate script in `<head>`.** It checks `sessionStorage` for the preview unlock and
  redirects to `index.html` if it is missing. Without it, an entry URL is an open door
  straight past the password.
- **The `.back` link** pointing at `../index.html#games` — see routing below.

## Routing

The homepage is a single page that swaps views, but `#websites` and `#games` are real
addresses. Landing on one — from a devlog's back link, or a shared link — calls
`showInstant()`, which puts you on the page with no dive. **The dive is the reward for
choosing a door, not a toll on every visit.** Diving sets the hash via `history.replaceState`;
coming home clears it.

Route restoration runs *after* the gate, in both the already-unlocked and just-unlocked
paths, so a deep link still asks for the password first.

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
