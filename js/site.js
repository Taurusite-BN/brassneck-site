/* ==================================================================
   Brassneck Studio — site behaviour

   Every URL is its own page now. What used to be here as well — the
   particle field, the magnetic body text, the 3D doors, the camera
   dive, the router and the tuner — went with the old one-document
   homepage, along with roughly two thirds of this file.

   Each initialiser below returns immediately on a page that has none
   of its elements, so one deferred script covers the whole site
   without any per-page wiring.
   ================================================================== */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const UMAMI_ID = (document.querySelector("script[data-website-id]") || {}).dataset
    ? document.querySelector("script[data-website-id]").dataset.websiteId
    : null;

  function trackView(path, title, retry) {
    if (!UMAMI_ID) return;
    try {
      if (window.umami) {
        window.umami.track({ website: UMAMI_ID, url: path, title: title });
      } else if (!retry) {
        // deep links can route before the deferred tracker has run
        setTimeout(() => trackView(path, title, true), 800);
      }
    } catch (e) { /* analytics must never break the site */ }
  }

  const REEL = [
    "SEO",
    "web design",
    "hosting and support",
    "traffic reports",
    "branding",
    "graphic design",
    "a lot more than will fit here!"
  ];

  function startReel() {
    const word = document.getElementById("reel-word");
    const rule = document.getElementById("reel-rule");
    if (!word || !rule) return;

    let i = 0;
    let busy = false;
    let onScreen = true;

    const measure = () => { rule.style.width = word.offsetWidth + "px"; };
    const show = n => { word.textContent = REEL[n]; measure(); };

    show(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);

    // Nothing is gained by animating a word that has been scrolled past.
    if (typeof IntersectionObserver === "function") {
      new IntersectionObserver(es => { onScreen = es[0].isIntersecting; })
        .observe(word);
    }

    if (reduce) {
      setInterval(() => {
        if (document.hidden || !onScreen) return;
        show(i = (i + 1) % REEL.length);
      }, 2600);
      return;
    }

    // Removing a class and adding another in the same frame does not
    // restart an animation on its own; the layout read in between is
    // what forces it.
    const restart = (off, on) => {
      word.classList.remove(off);
      void word.offsetWidth;
      word.classList.add(on);
    };

    // Driven by the animation finishing rather than by a timer set to
    // roughly its length. The old code swapped the text 20ms before
    // reel-out ended, which showed the new word for a frame at the old
    // one's position, and drifted further out of step on a busy main
    // thread.
    word.addEventListener("animationend", e => {
      if (e.animationName !== "reel-out") return;
      i = (i + 1) % REEL.length;
      word.textContent = REEL[i];
      restart("is-out", "is-in");
      measure();
      busy = false;
    });

    setInterval(() => {
      if (document.hidden || !onScreen || busy) return;
      busy = true;
      restart("is-in", "is-out");
    }, 2400);
  }

  const FORM_ENDPOINT = "https://formspree.io/f/maeybwaz";
  const FALLBACK_EMAIL = "oliver@brassneck.studio";

  function initEnquiry() {
    const form = document.getElementById("enquiry");
    if (!form) return;
    const status = document.getElementById("enquiry-status");
    const wired = FORM_ENDPOINT.indexOf("YOUR_FORM_ID") === -1;

    const say = (msg, kind) => {
      status.textContent = msg;
      status.className = "f-status" + (kind ? " is-" + kind : "");
    };

    const markBad = el => {
      const field = el.closest(".field");
      if (field) field.classList.add("is-bad");
    };

    form.addEventListener("input", e => {
      const field = e.target.closest(".field");
      if (field) field.classList.remove("is-bad");
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      form.querySelectorAll(".is-bad").forEach(f => f.classList.remove("is-bad"));

      const data = new FormData(form);
      if (data.get("_gotcha")) return;           // a bot filled the hidden field

      const required = ["name", "email", "message"];
      let firstBad = null;
      for (const key of required) {
        const el = form.elements[key];
        const val = (data.get(key) || "").toString().trim();
        const ok = key === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val) : val.length > 1;
        if (!ok) { markBad(el); if (!firstBad) firstBad = el; }
      }
      if (firstBad) {
        say("Something above needs another look.", "bad");
        firstBad.focus();
        return;
      }

      if (!wired) {
        const body = [
          "Name: " + data.get("name"),
          "Email: " + data.get("email"),
          "About: " + data.get("subject"),
          "Timescale: " + (data.get("timescale") || "not given"),
          "",
          data.get("message")
        ].join("\n");
        say("The form is not wired up yet. Opening your email instead.", "bad");
        window.location.href = "mailto:" + FALLBACK_EMAIL +
          "?subject=" + encodeURIComponent("Enquiry: " + data.get("subject")) +
          "&body=" + encodeURIComponent(body);
        return;
      }

      form.classList.add("is-sending");
      say("Sending…");

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          const done = document.createElement("div");
          done.className = "sent";
          done.innerHTML = "<h2>That is with me.</h2>" +
            "<p>I will read it properly and come back to you, usually within a day and always within three, " +
            "even if the answer is that I am not the right person for it.</p>";
          form.replaceWith(done);
          trackView("/contact/sent", "Enquiry sent: Brassneck Studio");
          return;
        }
        const payload = await res.json().catch(() => null);
        const msg = payload && payload.errors
          ? payload.errors.map(x => x.message).join(", ")
          : "That did not go through. Email " + FALLBACK_EMAIL + " and I will pick it up.";
        say(msg, "bad");
      } catch (err) {
        say("That did not go through. No connection. Email " + FALLBACK_EMAIL + " instead.", "bad");
      } finally {
        form.classList.remove("is-sending");
      }
    });
  }

  // One panel per game, plus the locked message. Slots carry data-slot for a
  // real game and data-quip for a locked one, so adding a third game is a
  // panel, a slot, and nothing in here.
  function initRoster() {
    const panels = [...document.querySelectorAll(".game-panel")];
    const locked = document.getElementById("locked-msg");
    const quip = document.getElementById("locked-quip");
    if (!panels.length || !locked) return;

    const slots = [...document.querySelectorAll(".roster .slot")];
    const first = slots.find(s => s.dataset.slot);
    let lastGame = first ? first.dataset.slot : null;

    const swapIn = el => {
      el.classList.remove("is-swapping");
      void el.offsetWidth;
      el.classList.add("is-swapping");
    };

    const show = (key, btn) => {
      panels.forEach(pnl => { pnl.hidden = pnl.id !== key; });
      locked.hidden = key !== null;
      const shown = key === null ? locked : panels.find(pnl => pnl.id === key);
      if (shown) swapIn(shown);
      if (key !== null) lastGame = key;

      slots.forEach(sl => {
        const on = sl === btn;
        sl.classList.toggle("is-current", on);
        if (sl.dataset.slot) sl.setAttribute("aria-pressed", String(on));
      });

      // the back button out of a locked slot returns you where you were
      document.querySelectorAll(".locked-back").forEach(b => {
        const name = document.querySelector('.roster .slot[data-slot="' + lastGame + '"] .slot-name');
        b.textContent = "\u2190 Back to " + (name ? name.textContent : "the games");
        b.dataset.slot = lastGame;
      });

      if (typeof measureTrailers === "function") measureTrailers();
    };

    slots.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.slot) {
          show(btn.dataset.slot, btn);
        } else {
          quip.textContent = btn.dataset.quip || "";
          show(null, btn);
        }
      });
    });

    document.querySelectorAll(".locked-back").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.slot || lastGame;
        show(key, slots.find(sl => sl.dataset.slot === key));
      });
    });
  }

  let measureTrailers = null;

  function initTrailerScroll() {
    const reels = [...document.querySelectorAll(".trailer-stage .reel")];
    if (!reels.length || reduce) return;

    const MIN = 0.84;
    const MAX = 1.0;
    let queued = false;

    const apply = () => {
      queued = false;
      const vh = window.innerHeight;
      reels.forEach(slot => {
        // a hidden panel measures as a zero-height box, so skip it
        if (!slot.offsetParent) return;
        const r = slot.getBoundingClientRect();
        if (!r.height) return;
        const centre = r.top + r.height / 2;
        // 1 when the slot sits dead centre, falling to 0 well before it leaves
        const nearness = Math.max(0, 1 - Math.abs(centre - vh / 2) / (vh * 0.62));
        const eased = nearness * nearness * (3 - 2 * nearness);
        slot.style.transform = "scale(" + (MIN + (MAX - MIN) * eased).toFixed(4) + ")";
        slot.style.opacity = (0.66 + 0.34 * eased).toFixed(3);
      });
    };
    measureTrailers = apply;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
  }

  const EXAMPLES = {
    "web-design": {
      title: "Web design",
      video: "/assets/video/door",
      cap: "The old Brassneck homepage: hover, open, and through. Recorded off the real thing.",
      open: "/demo/northwell/",
      openLabel: "See a finished site",
      body: "<p>Design is what the page asks of somebody, and how little work it makes them do to say yes. That is layout, type and structure before it is anything decorative.</p>" +
            "<p>The recording above is the old front page of this site: a door you could hover, open and walk through, built in the browser with no library behind it. It is here because it answers the only question that matters on this card, which is whether we can actually build the thing rather than describe it.</p>" +
            "<p>Most work is quieter than that. One idea per screen, one obvious thing to do, and a page that still reads at arm&rsquo;s length on a phone in bad light.</p>",
      prices: [
        ["Basic", "&pound;800", "One page done properly: mobile-first, enquiry form, analytics."],
        ["Standard", "&pound;1,500", "5 to 7 pages, copy shaped with you, analytics, search basics, form routing."],
        ["Larger projects", "Quoted", "Multiple languages, booking flows, bespoke interaction."],
        ["Extra page on an existing Brassneck site", "&pound;150", ""],
        ["Redesign of a site we didn&rsquo;t build", "From &pound;1,500", ""]
      ],
      foot: "Every build includes the first year&rsquo;s hosting."
    },
    "seo": {
      title: "SEO",
      shot: "/assets/example-seo.jpg",
      cap: "Where a month of visits came from, and the five searches that found the site.",
      open: "/demo/northwell/report/",
      openLabel: "See it in a full report",
      body: "<p>Being found is a structure problem before it is a keyword problem. What the pages are, what each one is called, and whether the thing somebody types at eleven at night matches anything you have written down.</p>" +
            "<p>So we title pages for the question rather than the service. &ldquo;No hot water&rdquo; is what gets typed; &ldquo;heating solutions&rdquo; is what gets written. The second one is why most small-business sites are invisible.</p>" +
            "<p>Where a site needs more than one language, each version is written rather than machine-translated, and sits at its own address so it can be found on its own terms.</p>",
      lead: "<b>Included free in every build:</b> titles, meta descriptions, schema, sitemap, clean URLs, fast load, and the Google Business Profile link. Most agencies sell that as an extra. It is just building a site properly.",
      prices: [
        ["SEO health check", "&pound;250", "A written report on a site you already have: what is wrong, and what it is costing."],
        ["SEO foundations on an existing site", "&pound;300", ""],
        ["Local SEO setup", "&pound;350", "Google Business Profile, local schema, citations, review-request flow."],
        ["Ongoing SEO", "&pound;300/month", "Three hours a month, three-month minimum."]
      ]
    },
    "hosting": {
      title: "Hosting &amp; support",
      shot: "/assets/example-hosting.jpg",
      cap: "A whole site in one file: no database, no CMS, nothing that can update itself and break.",
      open: "/demo/northwell/",
      openLabel: "Open the demo site",
      body: "<p>Nobody running a business should be updating plugins between jobs.</p>" +
            "<p>Everything we build is plain HTML, one stylesheet and one small script, served static. There is no CMS to be trained on, no database to go down, and nothing that can be broken by an update nobody asked for.</p>" +
            "<p>That is also why these sites are quick, and why they will still be quick in five years: there is almost nothing there to be slow. The example behind this card is a whole site in a single file.</p>",
      lead: "<b>The first year is included with every build.</b>",
      prices: [
        ["Lights On", "&pound;20/month", "Hosting, domain, SSL, uptime monitoring, off-site backups, annual link-and-form check."],
        ["Care", "&pound;60/month", "Above, plus 45 minutes of content edits a month (one month&rsquo;s rollover), a monthly traffic summary, and a reply inside two working days."],
        ["Partner", "&pound;100/month", "Above, plus an hour and a half of changes a month, a quarterly review call, and first call on new pages."],
        ["Migration of an existing site onto our hosting", "&pound;150", ""],
        ["Hosting for a site we didn&rsquo;t build", "&pound;30/month", ""]
      ],
      foot: "For what it is worth: every page on this site scores 100 for performance in Google Lighthouse, which is the tool Google uses to measure it. You can run it on this page yourself in about half a minute. We mention it here rather than on a banner because it is a consequence of building this way, not a feature we sell."
    },
    "reports": {
      title: "Traffic reports",
      shot: "/assets/example-reports.jpg",
      cap: "A worked example, start to finish, with invented figures for a business that does not exist.",
      open: "/demo/northwell/report/",
      openLabel: "Read the whole report",
      body: "<p>Analytics go on before launch, not when somebody eventually asks how it is going. You cannot report on what you did not measure, and the first month is the one worth having.</p>" +
            "<p>What comes back is a page, not a forty-page PDF: who came, what they did, and the one thing we would change next. Written so it can be read standing up.</p>" +
            "<p>The example behind this card is a full month, start to finish. The business is invented, so the figures are too; the shape and the wording are exactly what a real one carries.</p>",
      lead: "<b>Included in the Care and Partner plans</b> as a monthly summary.",
      prices: [
        ["One-off traffic review", "&pound;120", "What the site is actually doing, and where it leaks."],
        ["Analytics setup on an existing site", "&pound;100", ""]
      ]
    },
    "branding": {
      title: "Branding",
      shot: "/assets/example-branding.png",
      cap: "Our own mark at 128, 48, 32 and 16 pixels. If it survives the last one it survives anything.",
      body: "<p>A logo drawn in one room and a website built in another have to meet eventually, and they usually meet badly. Colours that were never going to sit together. A mark that needs a white box to survive. Type nobody checked against the body copy.</p>" +
            "<p>So we do both at once. The same brief, the same fortnight, one set of work to approve, and a site that was designed around the mark rather than apologising for it afterwards.</p>" +
            "<p>You get the mark, the palette and the type, tested at the sizes that actually break things: sixteen pixels in a browser tab, one colour on a receipt, and across the side of a van.</p>",
      prices: [
        ["Logo and identity, alongside a build", "From &pound;600", "The mark, the palette and the type, drawn in step with the site so nothing has to be retrofitted."]
      ]
    },
    "web-apps": {
      title: "Web apps &amp; installable apps",
      shot: "/assets/example-webapp.jpg",
      cap: "A real one, running. Change any answer and the figure changes with it.",
      open: "/demo/northwell/quote/",
      openLabel: "Use the live app",
      body: "<p>Most small businesses that ask for an app do not need one in an app store. They need one job doing well on a phone: book a slot, get a price, check a job sheet, log a reading.</p>" +
            "<p>So we build it for the browser, where it is one link and no download, and then make it installable, so it opens from an icon on the home screen, fills the screen with no address bar, and keeps working when the signal does not.</p>" +
            "<p>No review queue, no developer account, no waiting a week for a typo fix to be approved. The example behind this card is a quote calculator: three questions, no account, no server, and the arithmetic shown in full underneath, because a tool that will not show its working is one people ring up to check anyway.</p>",
      lead: "<b>Priced per project, after a free conversation about scope.</b> Small tools of the kind linked above are usually a few days&rsquo; work; anything with accounts, payments or a database behind it is quoted properly rather than guessed at.",
      prices: [
        ["A small tool, alongside a site", "From &pound;1,200", "Calculator, booking request, job sheet, checklist. One job, done well, installable."],
        ["A larger app", "Quoted", "Accounts, payments, a database, several roles. Scoped and quoted before anything is built."],
        ["Added to a site we already built", "From &pound;900", ""],
        ["Changes afterwards", "&pound;60/hour or &pound;450/day", ""]
      ],
      foot: "Native iOS and Android store apps are not something we take on. If that is genuinely what you need, we will say so and point you at somebody who does."
    },
    "graphic": {
      title: "Graphic design",
      shot: "/assets/example-graphic.jpg",
      cap: "A devlog set in its own game’s palette rather than the studio’s.",
      open: "/devlog/2026-09-20-scuttlers-one/",
      openLabel: "Open the devlog",
      body: "<p>The Articles devlog is set in the game's palette rather than the studio's (bone, sea slate, bilge dark, wet oak, lamp brass) so that opening an entry feels like stepping into the game rather than reading a blog post about it.</p>" +
            "<p>That is what this is for: everything around the main thing speaking in the same voice as the main thing.</p>",
      prices: [
        ["Social kit", "&pound;250", "Profile image, header, three post templates."],
        ["One-page PDF or flyer", "&pound;180", ""],
        ["Business card and email signature", "&pound;150", ""],
        ["Anything else", "&pound;60/hour or &pound;450/day", ""]
      ],
      foot: "Logos and identity are priced separately. See Branding."
    }
  };

  // The prices live in the data above rather than in the markup, because the
  // dialog is one component reused six times. Rows are [what, amount, note].
  function priceBlock(ex) {
    if (!ex.prices) return "";
    const rows = ex.prices.map(r =>
      '<li><span class="p-what">' + r[0] + '</span>' +
      '<span class="p-amt">' + r[1] + '</span>' +
      (r[2] ? '<span class="p-note">' + r[2] + '</span>' : '') +
      '</li>').join("");
    return '<div class="svc-prices">' +
      '<p class="svc-prices-h">What it costs</p>' +
      (ex.lead ? '<p class="svc-prices-lead">' + ex.lead + '</p>' : '') +
      '<ul>' + rows + '</ul>' +
      (ex.foot ? '<p class="svc-prices-foot">' + ex.foot + '</p>' : '') +
      '</div>';
  }

  function initExamples() {
    const modal = document.getElementById("svc-modal");
    if (!modal || typeof modal.showModal !== "function") return;
    const title = document.getElementById("svc-modal-title");
    const body = document.getElementById("svc-modal-body");
    const img = document.getElementById("svc-modal-img");
    const vid = document.getElementById("svc-modal-vid");
    const ph = document.getElementById("svc-modal-ph");
    const cap = document.getElementById("svc-modal-cap");
    const open = document.getElementById("svc-modal-open");
    const prices = document.getElementById("svc-modal-prices");

    let origin = null;
    let closing = false;

    // The dialog grows out of the card you clicked and shrinks back into it.
    // Cheap to do, and it answers the question "where did this come from".
    const framesFrom = card => {
      const d = modal.getBoundingClientRect();
      if (!card || !d.width) return null;
      const scale = Math.max(0.2, card.width / d.width);
      const dx = (card.left + card.width / 2) - (d.left + d.width / 2);
      const dy = (card.top + card.height / 2) - (d.top + d.height / 2);
      return [
        { transform: "translate(" + dx + "px," + dy + "px) scale(" + scale.toFixed(4) + ")", opacity: 0 },
        { transform: "none", opacity: 1 }
      ];
    };

    const EASE_OUT = { duration: reduce ? 1 : 400, easing: "cubic-bezier(.16,.84,.3,1)" };
    const EASE_IN  = { duration: reduce ? 1 : 260, easing: "cubic-bezier(.5,0,.85,.4)" };

    document.querySelectorAll("[data-svc]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ex = EXAMPLES[btn.dataset.svc];
        if (!ex) return;
        title.innerHTML = ex.title;
        prices.innerHTML = priceBlock(ex);
        body.innerHTML = ex.body;
        ph.innerHTML = ex.ph || "";
        cap.innerHTML = ex.cap || "";

        // A recording where there is motion worth showing, a still
        // otherwise. The <video> carries no audio track at all, so it
        // is allowed to autoplay; it is only fetched when a card that
        // wants it is opened, which is why preload is none.
        if (ex.video) {
          img.hidden = true;
          vid.hidden = false;
          if (vid.dataset.src !== ex.video) {
            vid.dataset.src = ex.video;
            vid.innerHTML =
              '<source src="' + ex.video + '.webm" type="video/webm">' +
              '<source src="' + ex.video + '.mp4" type="video/mp4">';
            if (ex.poster) vid.poster = ex.poster;
            vid.load();
          }
          const playing = vid.play();
          if (playing && playing.catch) playing.catch(() => {});
        } else {
          vid.hidden = true;
          vid.pause();
          img.hidden = false;
          img.onerror = () => { img.hidden = true; };
          img.src = ex.shot;
        }

        if (ex.open) {
          open.hidden = false;
          open.href = ex.open;
          open.innerHTML = (ex.openLabel || "Open it full size") +
            ' <span aria-hidden="true">&rarr;</span>';
        } else {
          open.hidden = true;
        }

        modal.scrollTop = 0;

        origin = btn.getBoundingClientRect();
        modal.showModal();
        const frames = framesFrom(origin);
        if (frames) modal.animate(frames, EASE_OUT);
        trackView("/websites/example/" + btn.dataset.svc, "Example: " + ex.title);
      });
    });

    // shrink back into the card rather than blinking out
    modal.addEventListener("cancel", e => {
      if (closing) return;
      e.preventDefault();
      dismiss();
    });
    modal.querySelectorAll("button[value=close]").forEach(b => {
      b.addEventListener("click", e => { e.preventDefault(); dismiss(); });
    });
    modal.addEventListener("click", e => { if (e.target === modal) dismiss(); });

    function dismiss() {
      if (closing) return;
      closing = true;
      const frames = framesFrom(origin);
      const done = () => { modal.close(); closing = false; vid.pause(); };
      if (!frames) { done(); return; }
      const anim = modal.animate([frames[1], frames[0]], EASE_IN);
      anim.onfinish = done;
      anim.oncancel = done;
    }
  }


  /* ================================================================ *
   * The masthead mark, against whatever is behind it
   *
   * The bar has no ground of its own, so the mark would disappear the
   * moment a White or Brass band scrolled under it. Each of the four
   * grounds gets a different one of the four brand colourways, swapped
   * by src: the fills are baked into the supplied files and the
   * guidelines are explicit that a colourway is changed by swapping
   * the file, not by recolouring it.
   * ================================================================ */

  const MARK = {
    ground: "/assets/logo/icon-white.svg",   // Dark Maroon page
    black:  "/assets/logo/icon-brass.svg",
    white:  "/assets/logo/icon-maroon.svg",
    brass:  "/assets/logo/icon-black.svg"
  };

  function initMastTone() {
    const mast = document.querySelector(".mast");
    const wrap = mast && mast.querySelector(".mast-mark");
    const up = wrap && wrap.querySelector(".mark-up");
    const dn = wrap && wrap.querySelector(".mark-dn");
    if (!mast || !up || !dn) return;

    const warm = () => Object.keys(MARK).forEach(k => { new Image().src = MARK[k]; });
    if (document.readyState === "complete") setTimeout(warm, 1200);
    else window.addEventListener("load", () => setTimeout(warm, 1200), { once: true });

    const TONED = ".closer, .tone-white, .tone-black, .tone-brass," +
                  " .h-white, .h-black, .h-brass";

    // What is behind one point, and which element decides it.
    const probe = y => {
      const r = wrap.getBoundingClientRect();
      const stack = document.elementsFromPoint(Math.round(r.left + r.width / 2), Math.round(y));
      const under = stack.find(el => !mast.contains(el));
      const hit = under && under.closest(TONED);
      if (!hit) return { tone: "ground", el: null };
      const c = hit.classList;
      const tone = (c.contains("closer") || c.contains("tone-brass") || c.contains("h-brass")) ? "brass"
                 : (c.contains("tone-white") || c.contains("h-white")) ? "white"
                 : "black";
      return { tone: tone, el: hit };
    };

    const setSrc = (img, tone) => { if (img.dataset.tone !== tone) { img.dataset.tone = tone; img.src = MARK[tone]; } };

    let queued = false;
    const apply = () => {
      queued = false;
      const r = wrap.getBoundingClientRect();
      if (!r.height) return;

      const top = probe(r.top + 1);
      const bot = probe(r.bottom - 1);

      // the nav and the button follow whatever the bar is mostly over
      const mid = probe(r.top + r.height / 2).tone;
      if (mast.dataset.tone !== mid) mast.dataset.tone = mid;

      if (top.tone === bot.tone) {
        setSrc(up, top.tone);
        dn.style.clipPath = "inset(100% 0 0 0)";
        return;
      }

      // A band edge is crossing the mark. Find where, in page coordinates:
      // either the lower band starts inside it, or the upper band ends there.
      let edge = null;
      if (bot.el) {
        const t = bot.el.getBoundingClientRect().top;
        if (t > r.top && t < r.bottom) edge = t;
      }
      if (edge === null && top.el) {
        const bm = top.el.getBoundingClientRect().bottom;
        if (bm > r.top && bm < r.bottom) edge = bm;
      }
      if (edge === null) edge = r.top + r.height / 2;

      setSrc(up, top.tone);
      setSrc(dn, bot.tone);
      const cut = Math.max(0, Math.min(r.height, edge - r.top));
      dn.style.clipPath = "inset(" + cut.toFixed(2) + "px 0 0 0)";
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
  }

  /* ================================================================ *
   * Smeaton's Tower
   *
   * One custom property, set from the band's position in the viewport,
   * which the CSS turns into a clip, a scale and the lamp coming on.
   * Gated on an IntersectionObserver so nothing is computed while the
   * band is nowhere near the screen.
   * ================================================================ */

  function initHoe() {
    const art = document.getElementById("hoe");
    if (!art) return;
    if (reduce) { art.style.setProperty("--grow", "1"); return; }

    let near = false, queued = false, last = -1;

    const apply = () => {
      queued = false;
      const r = art.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the top of it is at the bottom of the screen, 1 by the
      // time its middle has risen to just above the centre.
      const travel = vh * 0.78;
      const g = Math.max(0, Math.min(1, (vh - r.top) / travel));
      const v = Math.round(g * 100) / 100;
      if (v === last) return;
      last = v;
      art.style.setProperty("--grow", String(v));
    };

    const onScroll = () => {
      if (queued || !near) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    if (typeof IntersectionObserver === "function") {
      new IntersectionObserver(es => {
        near = es[0].isIntersecting;
        if (near) onScroll();
      }, { rootMargin: "120px 0px 120px 0px" }).observe(art);
    } else {
      near = true;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
  }

  /* ================================================================ *
   * The review deck
   *
   * The track scrolls and snaps on its own; this only adds the arrows
   * and the counter, and sets the deck's height to the review being
   * read so a two-line one does not sit in a box sized for a six
   * paragraph one.
   * ================================================================ */

  function initQuoteDeck() {
    const deck = document.querySelector("[data-deck]");
    if (!deck) return;
    const track = deck.querySelector(".quote-track");
    const slides = track ? [...track.querySelectorAll(".quote")] : [];
    const prev = deck.querySelector('[data-q="prev"]');
    const next = deck.querySelector('[data-q="next"]');
    if (!track || !prev || !next || slides.length < 2) return;

    // The arrows only exist once this runs; an arrow that does nothing
    // is worse than no arrow.
    deck.classList.add("is-ready");

    const index = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs((s.offsetLeft + s.offsetWidth / 2) - mid);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    };

    // Match the deck to the review being read, so a two-line one does
    // not sit in a box sized for six paragraphs.
    const fit = i => {
      const h = slides[i].getBoundingClientRect().height;
      if (h > 10) track.style.height = Math.ceil(h) + "px";
    };

    let queued = false;
    const sync = () => { queued = false; fit(index()); };
    track.addEventListener("scroll", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    }, { passive: true });

    // Wraps rather than stopping: with no counter on screen there is
    // nothing to tell you why an arrow has gone dead, so none does.
    const go = step => {
      const n = slides.length;
      const i = ((index() + step) % n + n) % n;
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft,
                       behavior: reduce ? "auto" : "smooth" });
    };
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });

    window.addEventListener("resize", () => { track.style.height = ""; sync(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    sync();
  }

  /* ---- wiring ----------------------------------------------------- */

  function boot() {
    initMastTone();
    initHoe();
    initQuoteDeck();
    startReel();
    initEnquiry();
    initRoster();
    initTrailerScroll();
    initExamples();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
