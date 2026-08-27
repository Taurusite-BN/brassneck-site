(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ================================================================ *
   * 0. Preview gate
   *
   * This keeps the unfinished site off the open web while it is being
   * reviewed. It is a doormat, not a lock: the markup is still in the
   * file for anyone who opens dev tools. Real access control belongs
   * on the host — see the README.
   * ================================================================ */

  const GATE_SHA = "b14ac78a46e90b7137f90518d51ce3677cf078db540d60d17097b6c40e25abf2";
  const GATE_FNV = "5190b83e";

  function fnv1a(str) {
    let h = 0x811c9dc5;
    const bytes = new TextEncoder().encode(str);
    for (const b of bytes) {
      h ^= b;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  async function digest(str) {
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return null;
  }

  function initGate() {
    const gate = document.getElementById("gate");
    if (!gate) return;
    const form  = document.getElementById("gate-form");
    const input = document.getElementById("gate-input");
    const err   = document.getElementById("gate-error");

    let already = false;
    try { already = sessionStorage.getItem("bn-preview") === "open"; } catch (e) {}
    if (already) { gate.remove(); document.documentElement.classList.add("is-unlocked"); return; }

    setTimeout(() => input.focus(), 60);

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const value = input.value.trim();
      const sha = await digest(value);
      const ok = sha ? sha === GATE_SHA : fnv1a(value) === GATE_FNV;

      if (!ok) {
        err.textContent = "That is not it.";
        gate.classList.add("is-wrong");
        setTimeout(() => gate.classList.remove("is-wrong"), 500);
        input.select();
        return;
      }

      try { sessionStorage.setItem("bn-preview", "open"); } catch (e) {}
      err.textContent = "";
      document.documentElement.classList.add("is-unlocked");
      gate.classList.add("is-open");
      setTimeout(() => gate.remove(), 620);
      measureHero();
      measureGlyphs();
    });
  }

  /* ================================================================ *
   * 1. The particle field
   * ================================================================ */

  const field = document.getElementById("field");
  const fx = field.getContext("2d");
  const wordCanvas = document.getElementById("wordfield");
  const fpsOut = document.getElementById("v-fps");

  const cfg = { density: 4, radius: 130, force: 1, speed: 1, dust: true, magnetic: true };

  let dpr = 1, vw = 0, vh = 0;
  let word = [], dust = [];
  let heroOx = 0, heroOy = 0;
  let wordAlpha = 1, wordTarget = 1;
  let diving = false;
  const pointer = { x: -9999, y: -9999, active: false };

  function sizeField() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    field.width = Math.floor(vw * dpr);
    field.height = Math.floor(vh * dpr);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function sampleWord() {
    const rect = wordCanvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w < 20 || h < 20) return;

    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const ox = off.getContext("2d");

    const text = "BRASSNECK";
    ox.textBaseline = "middle";
    ox.textAlign = "center";
    if ("letterSpacing" in ox) ox.letterSpacing = "-0.02em";

    let size = Math.floor(h * 0.94);
    for (let i = 0; i < 60; i++) {
      ox.font = "900 " + size + "px Archivo, system-ui, sans-serif";
      if (ox.measureText(text).width <= w * 0.94 || size <= 12) break;
      size -= Math.max(1, Math.round(size * 0.04));
    }
    ox.fillStyle = "#fff";
    ox.fillText(text, w / 2, h / 2);

    const data = ox.getImageData(0, 0, w, h).data;
    const step = cfg.density;
    const next = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) next.push({ tx: x, ty: y });
      }
    }

    word = next.map((t, i) => {
      const prev = word[i];
      return {
        tx: t.tx, ty: t.ty,
        x: prev ? prev.x : Math.random() * vw,
        y: prev ? prev.y : Math.random() * vh,
        vx: 0, vy: 0,
        r: step * (0.34 + Math.random() * 0.22),
        tone: Math.random()
      };
    });
  }

  function makeDust() {
    const target = Math.round((vw * vh) / 16000);
    dust = [];
    for (let i = 0; i < target; i++) {
      dust.push({
        x: Math.random() * vw, y: Math.random() * vh,
        vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
        r: 0.5 + Math.random() * 1.1,
        a: 0.06 + Math.random() * 0.16
      });
    }
  }

  function measureHero() {
    const rect = wordCanvas.getBoundingClientRect();
    heroOx = rect.left;
    heroOy = rect.top;
  }

  let lastT = 0, frameAvg = 16.7, fpsTick = 0;

  function tick(now) {
    if (lastT) {
      frameAvg += (Math.min(now - lastT, 60) - frameAvg) * 0.06;
      if (++fpsTick % 30 === 0 && fpsOut) fpsOut.textContent = frameAvg.toFixed(1) + " ms";
    }
    lastT = now;

    fx.clearRect(0, 0, vw, vh);

    // during the dive the canvas is the only thing not on the compositor —
    // stand it down so every frame belongs to the camera
    if (diving) { requestAnimationFrame(tick); return; }

    const rad = cfg.radius, rad2 = rad * rad, push = cfg.force;

    if (cfg.dust) {
      fx.fillStyle = "rgb(217,178,124)";
      for (const p of dust) {
        p.x += p.vx; p.y += p.vy;
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < rad2 * 2.2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / (rad * 1.48)) * 0.5 * push;
            p.vx += (dx / d) * f; p.vy += (dy / d) * f;
          }
        }
        p.vx *= 0.97; p.vy *= 0.97;
        if (p.x < -20) p.x = vw + 20;
        if (p.x > vw + 20) p.x = -20;
        if (p.y < -20) p.y = vh + 20;
        if (p.y > vh + 20) p.y = -20;
        fx.globalAlpha = p.a;
        fx.fillRect(p.x, p.y, p.r, p.r);
      }
      fx.globalAlpha = 1;
    }

    wordAlpha += (wordTarget - wordAlpha) * 0.12;

    if (wordAlpha > 0.01) {
      const t = now * 0.0006;
      for (const p of word) {
        const hx = p.tx + heroOx;
        const hy = p.ty + heroOy + Math.sin(t + p.tx * 0.03) * 1.6;

        let ax = (hx - p.x) * 0.055;
        let ay = (hy - p.y) * 0.055;

        if (pointer.active && wordTarget === 1) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < rad2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / rad) * 3.4 * push;
            ax += (dx / d) * f; ay += (dy / d) * f;
          }
        }

        p.vx = (p.vx + ax) * 0.84;
        p.vy = (p.vy + ay) * 0.84;
        p.x += p.vx; p.y += p.vy;

        const disp = Math.min(1, Math.hypot(p.x - hx, p.y - hy) / 60);
        const lum = 0.55 + p.tone * 0.3 + disp * 0.4;
        fx.fillStyle = "rgb(" +
          Math.round(176 + 60 * lum) + "," +
          Math.round(141 + 55 * lum) + "," +
          Math.round(87 + 70 * lum) + ")";
        fx.globalAlpha = (0.55 + p.tone * 0.45) * wordAlpha;
        fx.fillRect(p.x, p.y, p.r * 2, p.r * 2);
      }
      fx.globalAlpha = 1;
    }

    requestAnimationFrame(tick);
  }

  /* ================================================================ *
   * 2. Magnetic body text
   * ================================================================ */

  let glyphs = [];

  function splitMagnetic() {
    document.querySelectorAll("[data-magnetic]").forEach(el => {
      if (el.dataset.split === "yes") return;
      const words = el.textContent.split(/\s+/).filter(Boolean);
      el.textContent = "";
      const frag = document.createDocumentFragment();
      words.forEach((wordText, i) => {
        const wrap = document.createElement("span");
        wrap.className = "wd";
        for (const ch of wordText) {
          const s = document.createElement("span");
          s.className = "ch";
          s.textContent = ch;
          wrap.appendChild(s);
        }
        frag.appendChild(wrap);
        if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
      });
      el.appendChild(frag);
      el.dataset.split = "yes";
    });
    glyphs = [...document.querySelectorAll(".ch")].map(node => ({ node, cx: 0, cy: 0, x: 0, y: 0 }));
    measureGlyphs();
  }

  function measureGlyphs() {
    for (const g of glyphs) {
      g.node.style.transform = "";
      const r = g.node.getBoundingClientRect();
      g.cx = r.left + r.width / 2;
      g.cy = r.top + r.height / 2;
      g.x = 0; g.y = 0;
    }
  }

  function glyphTick() {
    const live = route === "home" && phase === "idle" && cfg.magnetic && pointer.active;
    const rad = cfg.radius * 1.15;
    for (const g of glyphs) {
      let tx = 0, ty = 0;
      if (live) {
        const dx = g.cx - pointer.x, dy = g.cy - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < rad && d > 0.01) {
          const f = (1 - d / rad) * 11 * cfg.force;
          tx = (dx / d) * f; ty = (dy / d) * f;
        }
      }
      g.x += (tx - g.x) * 0.16;
      g.y += (ty - g.y) * 0.16;
      g.node.style.transform =
        (Math.abs(g.x) < 0.05 && Math.abs(g.y) < 0.05)
          ? ""
          : "translate(" + g.x.toFixed(2) + "px," + g.y.toFixed(2) + "px)";
    }
    requestAnimationFrame(glyphTick);
  }

  /* ================================================================ *
   * 3. The camera
   *
   * There is no cross-fade and no stand-in element. The dive scales
   * the real scene about the real aperture, so the thing filling the
   * screen at the end IS the doorway you clicked. Nothing can drift,
   * because there is nothing to keep in register.
   * ================================================================ */

  const camera = document.getElementById("camera");
  const pages = {
    websites: document.getElementById("page-websites"),
    games:    document.getElementById("page-games")
  };
  const doors = {
    websites: document.getElementById("door-websites"),
    games:    document.getElementById("door-games")
  };

  let route = "home";
  let phase = "idle";
  let timers = [];

  const ms = n => (reduce ? 0 : Math.round(n / cfg.speed));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const after = (n, fn) => { const t = ms(n); if (t <= 0) { fn(); return; } timers.push(setTimeout(fn, t)); };

  // wait for a specific transition to finish, but never hang on a dropped event
  function onSettled(el, prop, budget, fn) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", handler);
      clearTimeout(guard);
      fn();
    };
    const handler = e => { if (e.target === el && e.propertyName === prop) finish(); };
    el.addEventListener("transitionend", handler);
    const guard = setTimeout(finish, budget + 220);
    timers.push(guard);
  }

  // the transform that flies the camera into a given aperture
  function apertureTransform(door) {
    const ap = door.querySelector(".aperture").getBoundingClientRect();
    const cam = camera.getBoundingClientRect();

    // origin is the aperture centre, expressed in the camera's own box
    const ox = ap.left + ap.width / 2 - cam.left;
    const oy = ap.top + ap.height / 2 - cam.top;

    // overshoot so the casing has cleared the frame well before the end
    const scale = Math.max(vw / ap.width, vh / ap.height) * 1.26;
    const dx = vw / 2 - (ap.left + ap.width / 2);
    const dy = vh / 2 - (ap.top + ap.height / 2);

    return {
      origin: ox.toFixed(2) + "px " + oy.toFixed(2) + "px",
      transform: "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px) scale(" + scale.toFixed(4) + ")"
    };
  }

  function setInert(on) {
    if (on) {
      camera.setAttribute("inert", "");
      camera.setAttribute("aria-hidden", "true");
    } else {
      camera.removeAttribute("inert");
      camera.removeAttribute("aria-hidden");
    }
  }

  const LEAF = 720, LEAD = 400, FLY = 900, FADE = 420;

  /* ---- home → section --------------------------------------------- */
  function diveTo(side) {
    if (phase !== "idle" || route !== "home") return;
    clearTimers();
    phase = "busy";
    diving = true;
    wordTarget = 0;

    const door = doors[side];
    const page = pages[side];

    // lock the scroll before anything moves, so no rect can shift mid-flight
    document.documentElement.classList.add("is-locked");
    wake(door);
    requestAnimationFrame(() => door.classList.add("is-open"));

    // give the compositor a frame to promote the layer before it matters
    camera.style.willChange = "transform";

    after(LEAD, () => {
      const t = apertureTransform(door);
      camera.style.transformOrigin = t.origin;
      camera.style.transition = "transform " + ms(FLY) + "ms var(--push)";
      // parallax: the far glow lags the frame, the floor runs ahead
      door.querySelector(".room-glow").style.transform = "scale(0.82)";
      door.querySelector(".room-floor").style.transform = "scaleY(1.35)";
      requestAnimationFrame(() => { camera.style.transform = t.transform; });
      // you are past the leaf now — take it out of shot rather than
      // letting it hang at the frame edge until the page swap
      after(180, () => door.classList.add("is-through"));

      onSettled(camera, "transform", ms(FLY), () => {
        // the screen is now the inside of the doorway — fade the page onto it
        page.classList.add("is-active");
        route = side;
        setInert(true);
        document.title = side === "websites" ? "Websites — Brassneck Studio" : "Games — Brassneck Studio";

        after(FADE + 40, () => {
          // hidden behind an opaque page: stand the camera back down
          camera.style.transition = "none";
          camera.style.transform = "";
          camera.style.transformOrigin = "";
          camera.style.willChange = "auto";
          shutFlat(door);
          door.classList.remove("is-through");
          door.querySelector(".room-glow").style.transform = "";
          door.querySelector(".room-floor").style.transform = "";
          diving = false;
          phase = "idle";
          page.scrollTop = 0;
          const back = page.querySelector(".backlink");
          if (back) back.focus({ preventScroll: true });
        });
      });
    });
  }

  /* ---- section → home --------------------------------------------- */
  function backOut(then) {
    if (phase !== "idle" || route === "home") return;
    clearTimers();
    phase = "busy";
    diving = true;

    const side = route;
    const door = doors[side];
    const page = pages[side];

    // re-enter the scene exactly where we left it: door open, camera inside
    wake(door);
    door.classList.add("is-open");
    door.classList.add("is-through");
    camera.style.willChange = "transform";
    camera.style.transition = "none";
    const t = apertureTransform(door);
    camera.style.transformOrigin = t.origin;
    camera.style.transform = t.transform;
    door.querySelector(".room-glow").style.transform = "scale(0.82)";
    door.querySelector(".room-floor").style.transform = "scaleY(1.35)";
    void camera.offsetWidth;

    setInert(false);
    page.classList.remove("is-active");
    route = "home";
    document.title = "Brassneck Threshold";

    after(FADE, () => {
      camera.style.transition = "transform " + ms(FLY + 80) + "ms var(--pull)";
      door.querySelector(".room-glow").style.transition = "transform " + ms(FLY + 80) + "ms var(--pull)";
      door.querySelector(".room-floor").style.transition = "transform " + ms(FLY + 80) + "ms var(--pull)";
      requestAnimationFrame(() => {
        camera.style.transform = "";
        door.querySelector(".room-glow").style.transform = "";
        door.querySelector(".room-floor").style.transform = "";
      });

      onSettled(camera, "transform", ms(FLY + 80), () => {
        shutFlat(door);
        requestAnimationFrame(() => door.classList.remove("is-through"));
        camera.style.transition = "none";
        camera.style.transformOrigin = "";
        camera.style.willChange = "auto";
        door.querySelector(".room-glow").style.transition = "";
        door.querySelector(".room-floor").style.transition = "";
        document.documentElement.classList.remove("is-locked");
        diving = false;
        wordTarget = 1;
        measureHero();
        measureGlyphs();
        phase = "idle";
        if (then) { then(); return; }
        const btn = door.closest(".portal-btn");
        if (btn) btn.focus({ preventScroll: true });
      });
    });
  }

  function go(dest) {
    if (dest === route || phase !== "idle") return;
    if (dest === "home") { backOut(); return; }
    if (route === "home") { diveTo(dest); return; }
    backOut(() => after(120, () => diveTo(dest)));
  }

  // The leaf is a flat element at rest and while teasing open — only the full
  // swing needs a real 3D box, and it is torn down again the moment the door
  // is shut. Nothing ever sits still in a preserve-3d state.
  function wake(door) { if (door) door.classList.add("is-live"); }

  // Shut the leaf with no transition at all and drop it back to a flat 2D
  // element. Called only while the leaf is out of shot, so the snap is unseen —
  // and it avoids leaving a compositor animation running across the moment the
  // camera layer is torn down, which strands the leaf mid-swing.
  function shutFlat(door) {
    if (!door) return;
    door.classList.add("no-swing");
    door.classList.remove("is-open");
    door.classList.remove("is-live");
    void door.offsetWidth;
    door.classList.remove("no-swing");
  }

  document.querySelectorAll(".portal-btn").forEach(btn => {
    btn.addEventListener("pointerenter", () => {
      if (route === "home" && phase === "idle") camera.style.willChange = "transform";
    });
  });

  document.querySelectorAll("[data-go]").forEach(el => {
    el.addEventListener("click", () => go(el.dataset.go));
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && route !== "home") go("home");
  });

  /* ================================================================ *
   * 4. Wiring
   * ================================================================ */

  window.addEventListener("pointermove", e => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { pointer.active = false; });
  window.addEventListener("blur", () => { pointer.active = false; });

  let resizeId;
  window.addEventListener("resize", () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(() => {
      sizeField(); measureHero(); sampleWord(); makeDust(); measureGlyphs();
    }, 120);
  });
  window.addEventListener("scroll", () => {
    if (route === "home" && phase === "idle") { measureHero(); measureGlyphs(); }
  }, { passive: true });

  const bind = (id, key, out, fmt) => {
    const el = document.getElementById(id);
    const label = out ? document.getElementById(out) : null;
    el.addEventListener("input", () => {
      if (el.type === "checkbox") {
        cfg[key] = el.checked;
        if (key === "dust" && cfg.dust && dust.length === 0) makeDust();
      } else {
        cfg[key] = parseFloat(el.value);
        if (label) label.textContent = fmt ? fmt(cfg[key]) : cfg[key];
        if (key === "density") sampleWord();
      }
    });
  };

  bind("c-density", "density", "v-density");
  bind("c-radius", "radius", "v-radius");
  bind("c-force", "force", "v-force", v => v.toFixed(1));
  bind("c-speed", "speed", "v-speed", v => v.toFixed(1) + "×");
  bind("c-magnetic", "magnetic");
  bind("c-dust", "dust");

  // Some engines skip the first paint of a backface-hidden child inside an
  // untransformed preserve-3d parent — the door then only appears once a hover
  // dirties it. Nudge each leaf by a hair and put it straight back.
  function kickLeaves() {
    document.querySelectorAll(".leaf-front").forEach(el => { void el.offsetWidth; });
  }

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    sizeField(); measureHero(); sampleWord(); makeDust(); splitMagnetic();
    kickLeaves();
    initGate();
    requestAnimationFrame(tick);
    requestAnimationFrame(glyphTick);
  }

  // late webfont swaps and slow first paints get a second nudge
  window.addEventListener("load", kickLeaves);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);
    setTimeout(boot, 2500);
  } else {
    boot();
  }
})();
