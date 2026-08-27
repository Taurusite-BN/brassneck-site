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

## Files

```
index.html            all three views — home, work, games
css/styles.css        design tokens at the top, then components in page order
js/threshold.js       particles, magnetic text, and the door/dive sequence
assets/               the mark, used as the favicon
```

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
| 0 | scroll locked, leaf swings open (720ms) |
| 400 | camera scales the real scene about the real aperture (900ms) |
| 1300 | `transitionend` — the doorway now fills the screen; page fades onto it (420ms) |
| 1760 | camera stood back down behind the opaque page; focus to the back link |

There is no stand-in element and no cross-fade between two copies of the doorway. The
thing filling the screen at the end of the flight *is* the aperture you clicked, scaled
about its own centre — so there is nothing to keep in register and nothing that can
drift. The swap waits on `transitionend`, not a timer, with a timeout only as a guard
against a dropped event.

Two things to leave alone unless you know why they're there: the scroll lock plus
`scrollbar-gutter: stable` on `html` (without the gutter, hiding the scrollbar mid-flight
shifts the whole layout ~15px), and the absence of `isolation`, `filter`, `opacity` or
`overflow` on `.door` and its ancestors — any of those silently forces
`transform-style: flat` and collapses the 3D leaf into a 2D squash.

**Door copy and page content** — plain HTML in `index.html`, in three `<div class="view">`
blocks. The case study cards are the six-step template from the site plan with the fields
still to be filled in.

## Known gaps, deliberately

- Views swap in place rather than being real pages. For the Astro build these become
  `/work` and `/games` with the View Transitions API running the same phases, so the dive
  survives a direct link and the back button.
- The Games page footage slot is empty. It's the one thing that page needs.
- The dive is untested on touch devices.
