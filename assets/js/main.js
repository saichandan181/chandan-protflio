/* =========================================================
   Sai Chandan — portfolio interactions
   Progressive enhancement only: with JavaScript off (or with
   reduced motion) every word of content is still there.
   ========================================================= */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const EMAIL = "sanda.rsc@icloud.com";
  const RESUME = "assets/images/Sanda%20Reddy%20Sai%20Chandan-Eng21am0108.pdf";
  const LINKS = {
    github: "https://github.com/saichandan181",
    linkedin: "https://linkedin.com/in/reddy-sai-chandan-851102300",
    x: "https://twitter.com/saichandan181",
    instagram: "https://instagram.com/saichandan.sanda",
    coffee: "https://www.buymeacoffee.com/saichandan",
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* =======================================================
     Motion preference (OS setting + in-page toggle)
     ======================================================= */
  const osReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motionOK = () => {
    const pref = root.getAttribute("data-motion");
    if (pref === "reduced") return false;
    if (pref === "full") return true;
    return !osReduced.matches;
  };
  const motionListeners = new Set();
  const applyMotion = () => {
    const on = motionOK();
    root.classList.toggle("motion-ok", on);
    motionListeners.forEach((fn) => fn(on));
  };
  root.classList.toggle("motion-ok", motionOK());
  osReduced.addEventListener?.("change", applyMotion);

  const motionBtn = $("#motion-toggle");
  const syncMotionBtn = () => {
    if (!motionBtn) return;
    const reduced = !motionOK();
    motionBtn.setAttribute("aria-pressed", String(reduced));
    $("[data-motion-label]", motionBtn).textContent = reduced ? "Motion reduced" : "Reduce motion";
  };
  const toggleMotion = () => {
    const next = motionOK() ? "reduced" : "full";
    root.setAttribute("data-motion", next);
    store.set("motion", next);
    applyMotion();
    syncMotionBtn();
    toast(next === "reduced" ? "Motion reduced" : "Full motion on");
  };
  motionBtn?.addEventListener("click", toggleMotion);
  syncMotionBtn();

  /* =======================================================
     Toast
     ======================================================= */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      setTimeout(() => { toastEl.textContent = ""; }, 500);
    }, 2600);
  }

  /* =======================================================
     Theme — circular reveal via the View Transitions API
     ======================================================= */
  const themeBtn = $("#theme-toggle");
  const osDark = window.matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = () => root.getAttribute("data-theme") || (osDark.matches ? "dark" : "light");
  const syncThemeBtn = () => {
    const t = currentTheme();
    themeBtn?.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", t === "dark" ? "#0e0e0d" : "#f3f1ec"));
  };
  const toggleTheme = (origin) => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    const apply = () => {
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      syncThemeBtn();
    };
    if (!document.startViewTransition || !motionOK()) { apply(); return; }
    const r = (origin || themeBtn)?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : innerWidth / 2;
    const y = r ? r.top + r.height / 2 : 0;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  };
  themeBtn?.addEventListener("click", () => toggleTheme(themeBtn));
  osDark.addEventListener?.("change", syncThemeBtn);
  syncThemeBtn();

  /* =======================================================
     Text splitting (visual copy is aria-hidden; the real
     text stays available to assistive tech)
     ======================================================= */
  const srCopy = (el) => {
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = el.textContent.replace(/\s+/g, " ").trim();
    return sr;
  };

  // Hero name → letters
  $$("[data-split-letters]").forEach((el) => {
    const text = el.textContent.trim();
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    let li = 0;
    for (const ch of text) {
      if (ch === " ") { visual.insertAdjacentHTML("beforeend", '<span class="sp"></span>'); continue; }
      visual.insertAdjacentHTML("beforeend", `<span class="ch"><span class="ch-i" style="--li:${li++}">${esc(ch)}</span></span>`);
    }
    const sr = srCopy(el);
    el.textContent = "";
    el.append(sr, visual);
  });

  // Section titles → words (keeps <em> styling)
  $$("[data-split-words]").forEach((el) => {
    const sr = srCopy(el);
    const visual = el.cloneNode(true);
    let wi = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.innerHTML = `<span style="--wi:${wi++}">${esc(part)}</span>`;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(visual);
    const wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.append(...visual.childNodes);
    el.textContent = "";
    el.append(sr, wrap);
  });

  // About paragraph → words that light up as you read
  const highlightEl = $("[data-highlight]");
  let highlightWords = [];
  if (highlightEl) {
    const words = highlightEl.textContent.trim().split(/\s+/);
    highlightEl.innerHTML = words.map((w) => `<span class="hw">${esc(w)}</span>`).join(" ");
    highlightWords = $$(".hw", highlightEl);
  }

  // Button text roll: add an aria-hidden duplicate label
  $$(".roll").forEach((el) => {
    const t = el.textContent.trim();
    el.innerHTML = `<span>${esc(t)}</span><span aria-hidden="true">${esc(t)}</span>`;
  });

  /* =======================================================
     Header: scrolled state, hide-on-scroll, progress, spy
     ======================================================= */
  const header = $(".site-header");
  const progressEl = $(".scroll-progress");
  const nav = $("#site-nav");
  const navLinks = $$(".site-nav a");
  const indicator = $(".nav-indicator");
  let lastY = window.scrollY;

  const moveIndicator = (link) => {
    if (!indicator) return;
    if (!link) { indicator.style.setProperty("--o", 0); return; }
    indicator.style.setProperty("--x", `${link.offsetLeft}px`);
    indicator.style.setProperty("--w", `${link.offsetWidth}px`);
    indicator.style.setProperty("--o", 1);
  };
  const currentLink = () => navLinks.find((a) => a.getAttribute("aria-current") === "true");
  navLinks.forEach((a) => {
    a.addEventListener("pointerenter", () => moveIndicator(a));
    a.addEventListener("focus", () => moveIndicator(a));
  });
  nav?.addEventListener("pointerleave", () => moveIndicator(currentLink()));
  nav?.addEventListener("focusout", (e) => { if (!nav.contains(e.relatedTarget)) moveIndicator(currentLink()); });

  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const ratios = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio + 0.0001 : 0));
      let best = null, bestR = 0;
      ratios.forEach((r, id) => { if (r > bestR) { best = id; bestR = r; } });
      navLinks.forEach((a) => {
        if (best && a.getAttribute("href") === `#${best}`) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (!nav?.matches(":hover")) moveIndicator(currentLink());
    }, { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] });
    sections.forEach((s) => spy.observe(s));
  }

  /* =======================================================
     Mobile menu
     ======================================================= */
  const menuBtn = $("#menu-toggle");
  const setMenu = (open, { focusBtn = false } = {}) => {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    header?.classList.remove("is-hidden");
    if (open) setTimeout(() => $("a", nav)?.focus(), 50);
    else if (focusBtn) menuBtn.focus();
  };
  menuBtn?.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  nav?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav?.classList.contains("is-open")) setMenu(false, { focusBtn: true });
  });
  document.addEventListener("click", (e) => {
    if (nav?.classList.contains("is-open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });
  window.matchMedia("(min-width: 881px)").addEventListener?.("change", (e) => { if (e.matches) setMenu(false); });

  /* =======================================================
     In-page anchors: scroll + move focus to the target
     ======================================================= */
  const focusTarget = (el) => {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const top = id === "#top" || id === "#main";
    const target = top ? $("#main") : $(id);
    if (!target) return;
    e.preventDefault();
    if (top) window.scrollTo({ top: 0 });
    else target.scrollIntoView({ block: "start" });
    focusTarget(target);
    window.history.replaceState(null, "", top ? location.pathname : id);
  });

  /* =======================================================
     Reveal on scroll (fade/rise, 3D word flips, line drawing)
     ======================================================= */
  const revealEls = $$(".reveal");
  const wordTitles = $$("[data-split-words]");
  const workCards = $$(".work-card");
  if ("IntersectionObserver" in window) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const i = groups.get(el.parentElement) || 0;
      groups.set(el.parentElement, i + 1);
      el.style.setProperty("--d", `${Math.min(i, 6) * 80}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.matches("[data-split-words]") ? "is-in" : e.target.matches(".work-card") ? "is-drawn" : "is-visible");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    [...revealEls, ...wordTitles, ...workCards].forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    wordTitles.forEach((el) => el.classList.add("is-in"));
    workCards.forEach((el) => el.classList.add("is-drawn"));
  }
  window.addEventListener("beforeprint", () => revealEls.forEach((el) => el.classList.add("is-visible")));

  /* =======================================================
     Scroll engine — every scroll-linked 3D effect in one rAF
     ======================================================= */
  const hero = $(".hero");
  const heroInner = $("[data-hero]");
  const heroLetters = $$(".hero-name .ch");
  const portrait = $(".hero-portrait");
  const strips = $$("[data-strip]");
  const rises = $$("[data-rise]");
  const zoomEl = $("[data-zoom]");
  const workItems = $$(".work-item");
  const timelines = $$("[data-timeline]");
  const stickyMQ = window.matchMedia("(min-width: 901px)");

  const clearScrollFx = () => {
    [heroInner, ...heroLetters, ...rises, zoomEl].forEach((el) => { if (el) { el.style.transform = ""; el.style.opacity = ""; } });
    strips.forEach((el) => el.style.removeProperty("--sx"));
    workCards.forEach((c) => { c.style.removeProperty("--s"); c.style.removeProperty("--r"); c.style.removeProperty("--dim"); });
    portrait?.style.removeProperty("--py");
    highlightWords.forEach((w) => w.classList.add("on"));
    timelines.forEach((t) => t.style.removeProperty("--tl"));
  };

  let scheduled = false;
  const frame = () => {
    scheduled = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    // header + progress (always on — not motion)
    header?.classList.toggle("is-scrolled", y > 8);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    const menuOpen = nav?.classList.contains("is-open");
    const headerHasFocus = header?.contains(document.activeElement);
    if (goingDown && y > 480 && !menuOpen && !headerHasFocus) header?.classList.add("is-hidden");
    else if (goingUp || y < 480) header?.classList.remove("is-hidden");
    lastY = y;
    const max = document.documentElement.scrollHeight - vh;
    progressEl?.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);

    if (!motionOK()) return;

    // Hero: the whole stage tilts back in 3D as you leave it; letters peel away
    if (hero && heroInner) {
      const h = hero.offsetHeight || 1;
      const p = clamp(y / h);
      heroInner.style.transform = `translate3d(0, ${p * 90}px, 0) rotateX(${p * 16}deg) scale(${1 - p * 0.08})`;
      heroInner.style.opacity = String(1 - p * 0.85);
      heroLetters.forEach((ch, i) => {
        const lp = clamp(p * 1.8 - i * 0.045);
        ch.style.transform = `translate3d(0, ${-lp * (30 + (i % 3) * 18)}px, 0) rotateX(${lp * 65}deg)`;
      });
      portrait?.style.setProperty("--py", `${p * 40}px`);
    }

    // Strip: rows slide in opposite directions, linked to scroll
    strips.forEach((row) => {
      const r = row.parentElement.getBoundingClientRect();
      const q = clamp((vh - r.top) / (vh + r.height));
      const span = Math.max(0, row.scrollWidth - innerWidth);
      const dir = Number(row.dataset.strip);
      const x = dir < 0 ? -q * span * 0.55 : -span * 0.6 + q * span * 0.55;
      row.style.setProperty("--sx", `${x.toFixed(1)}px`);
    });

    // About: words light up as the paragraph passes through the viewport
    if (highlightEl && highlightWords.length) {
      const r = highlightEl.getBoundingClientRect();
      const q = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const n = Math.round(q * highlightWords.length);
      highlightWords.forEach((w, i) => w.classList.toggle("on", i < n));
    }

    // Experience: the timeline line draws down as you read
    timelines.forEach((t) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--tl", clamp((vh * 0.75 - r.top) / (r.height || 1)).toFixed(3));
    });

    // Expertise: cards rise up from a reclined 3D angle
    rises.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const q = clamp((vh - r.top) / (vh * 0.45) - (i % 4) * 0.12);
      card.style.transform = `translate3d(0, ${(1 - q) * 90}px, 0) rotateX(${(1 - q) * 38}deg)`;
      card.style.opacity = String(0.2 + q * 0.8);
    });

    // Work: sticky stack — each card recedes in 3D as the next covers it
    const stacking = stickyMQ.matches;
    workCards.forEach((card, i) => {
      const next = workItems[i + 1];
      if (!stacking || !next) {
        card.style.removeProperty("--s"); card.style.removeProperty("--r"); card.style.removeProperty("--dim");
        return;
      }
      const cr = card.getBoundingClientRect();
      const nr = next.getBoundingClientRect();
      const p = clamp(1 - (nr.top - cr.top) / (cr.height || 1));
      card.style.setProperty("--s", (1 - p * 0.08).toFixed(4));
      card.style.setProperty("--r", `${(-p * 9).toFixed(2)}deg`);
      card.style.setProperty("--dim", (p * 0.28).toFixed(3));
    });

    // Contact: headline scales up into place
    if (zoomEl) {
      const r = zoomEl.getBoundingClientRect();
      const q = clamp((vh - r.top) / (vh * 0.7));
      zoomEl.style.transform = `translate3d(0, ${(1 - q) * 80}px, 0) scale(${0.82 + q * 0.18})`;
      zoomEl.style.opacity = String(0.25 + q * 0.75);
    }
  };
  const requestFrame = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });
  motionListeners.add((on) => { if (!on) clearScrollFx(); requestFrame(); });
  if (!motionOK()) clearScrollFx();
  requestFrame();

  /* =======================================================
     Micro-interactions: 3D tilt + magnetic buttons
     ======================================================= */
  const canHover = () => finePointer.matches && motionOK();

  $$("[data-tilt]").forEach((el) => {
    const isPortrait = el.classList.contains("hero-portrait");
    const strength = isPortrait ? 12 : 8;
    el.addEventListener("pointermove", (e) => {
      if (!canHover()) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.classList.add("is-tilting");
      el.style.setProperty("--rx", `${((0.5 - y) * strength).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * strength).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      if (isPortrait) el.style.setProperty("--px", `${((0.5 - x) * 14).toFixed(1)}px`);
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("is-tilting");
      ["--rx", "--ry", "--px"].forEach((p) => el.style.removeProperty(p));
    });
  });

  $$("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (!canHover()) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px, 0)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  /* =======================================================
     Clocks, year, jokes, copy email
     ======================================================= */
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => {
      const now = new Date();
      clocks.forEach((t) => { t.textContent = `${fmt.format(now).toUpperCase()} IST`; t.dateTime = now.toISOString(); });
    };
    tick();
    setInterval(tick, 30000);
  }
  // "1 yr 3 mos" — counted inclusively, the way LinkedIn does, so it stays current
  $$("[data-tenure]").forEach((el) => {
    const [y, m] = el.dataset.since.split("-").map(Number);
    const now = new Date();
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1;
    if (!(months > 0)) return;
    const yrs = Math.floor(months / 12), mos = months % 12;
    const parts = [];
    if (yrs) parts.push(`${yrs} yr${yrs > 1 ? "s" : ""}`);
    if (mos) parts.push(`${mos} mo${mos > 1 ? "s" : ""}`);
    el.textContent = parts.join(" ");
  });

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const JOKES = [
    "I told my agent to take a break. It spawned three sub-agents to plan the break.",
    "Why do Java developers wear glasses? Because they don’t C#.",
    "There are 10 kinds of people: those who understand binary and those who don’t.",
    "I would tell you a UDP joke, but you might not get it.",
    "React Native: write once, debug everywhere.",
    "A SQL query walks into a bar, walks up to two tables and asks: “Can I join you?”",
    "Governor limits are just Salesforce’s way of saying “touch grass”.",
    "I asked the LLM for a joke about recursion. It asked me for a joke about recursion.",
  ];
  let jokeIdx = -1;
  const nextJoke = () => {
    let i;
    do { i = Math.floor(Math.random() * JOKES.length); } while (i === jokeIdx);
    jokeIdx = i;
    return JOKES[i];
  };
  const jokeBtn = $("#joke-btn");
  const jokeOut = $("#joke-out");
  jokeBtn?.addEventListener("click", () => {
    jokeOut.textContent = nextJoke();
    jokeBtn.textContent = "Another one";
  });

  async function copyEmail() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    toast(ok ? `Copied ${EMAIL}` : `Couldn’t copy — my email is ${EMAIL}`);
    return ok;
  }
  $$("[data-copy-email]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await copyEmail();
      const label = $("[data-copy-label]", btn);
      const use = $("[data-copy-icon]", btn);
      if (!ok || !label) return;
      label.textContent = "Copied";
      use?.setAttribute("href", "#i-check");
      setTimeout(() => { label.textContent = "Copy email"; use?.setAttribute("href", "#i-copy"); }, 2200);
    });
  });

  /* =======================================================
     Live GitHub data (language + stars), best effort
     ======================================================= */
  const repoEls = $$("[data-repo]");
  if (repoEls.length && "fetch" in window) {
    const KEY = "gh-repos-v1";
    const paint = (repos) => {
      const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
      repoEls.forEach((el) => {
        const r = byName.get(el.dataset.repo.toLowerCase());
        if (!r) return;
        const lang = $("[data-lang]", el);
        if (lang && r.language) lang.textContent = r.language;
        const stars = $("[data-stars]", el);
        if (stars && r.stargazers_count > 0) {
          stars.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>${r.stargazers_count}<span class="sr-only"> GitHub stars</span>`;
          stars.hidden = false;
        }
      });
    };
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { /* ignore */ }
    if (cached) paint(cached);
    else {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      fetch("https://api.github.com/users/saichandan181/repos?per_page=100", { signal: ctrl.signal, headers: { Accept: "application/vnd.github+json" } })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data) => {
          if (!Array.isArray(data)) return;
          const slim = data.map(({ name, language, stargazers_count }) => ({ name, language, stargazers_count }));
          try { sessionStorage.setItem(KEY, JSON.stringify(slim)); } catch { /* ignore */ }
          paint(slim);
        })
        .catch(() => { /* offline or rate-limited — static content already shows */ });
    }
  }

  /* =======================================================
     Command palette (Ctrl/⌘ + K)
     ======================================================= */
  const palette = $("#palette");
  const pInput = $("#palette-input");
  const pList = $("#palette-list");
  const pStatus = $("#palette-status");
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$("[data-mod-key]").forEach((k) => { k.textContent = isMac ? "⌘K" : "Ctrl K"; });

  const go = (hash) => () => {
    const el = $(hash);
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    focusTarget(el);
    window.history.replaceState(null, "", hash);
  };
  const openUrl = (url) => () => window.open(url, "_blank", "noopener");

  const ITEMS = [
    { group: "Go to", label: "About", icon: "i-arrow-right", run: go("#about"), keys: "who bio education" },
    { group: "Go to", label: "Experience", icon: "i-arrow-right", run: go("#experience"), keys: "unisys job work history education certifications claude certified architect resume" },
    { group: "Go to", label: "Expertise", icon: "i-arrow-right", run: go("#expertise"), keys: "skills stack tech tools mobile ai salesforce" },
    { group: "Go to", label: "Selected work", icon: "i-arrow-right", run: go("#work"), keys: "projects portfolio" },
    { group: "Go to", label: "Now", icon: "i-arrow-right", run: go("#now"), keys: "learning ask" },
    { group: "Go to", label: "Contact", icon: "i-arrow-right", run: go("#contact"), keys: "email hire" },
    { group: "Actions", label: "Copy email address", icon: "i-copy", run: copyEmail, keys: "mail clipboard" },
    { group: "Actions", label: "Send an email", icon: "i-mail", run: () => { location.href = `mailto:${EMAIL}`; }, keys: "mail contact" },
    { group: "Actions", label: "Download résumé (PDF)", icon: "i-file", run: () => { const a = document.createElement("a"); a.href = RESUME; a.download = "Sai-Chandan-Resume.pdf"; a.click(); }, keys: "cv resume" },
    { group: "Actions", label: "Toggle light / dark theme", icon: "i-sun", run: () => toggleTheme(themeBtn), keys: "dark light mode color" },
    { group: "Actions", label: "Reduce or restore motion", icon: "i-pause", run: toggleMotion, keys: "animation accessibility" },
    { group: "Actions", label: "Tell me a joke", icon: "i-arrow-right", run: () => toast(nextJoke()), keys: "funny fun" },
    { group: "Profiles", label: "GitHub", icon: "i-github", run: openUrl(LINKS.github), hint: "↗", keys: "code repos" },
    { group: "Profiles", label: "LinkedIn", icon: "i-linkedin", run: openUrl(LINKS.linkedin), hint: "↗", keys: "work" },
    { group: "Profiles", label: "X (Twitter)", icon: "i-x", run: openUrl(LINKS.x), hint: "↗", keys: "twitter" },
    { group: "Profiles", label: "Instagram", icon: "i-instagram", run: openUrl(LINKS.instagram), hint: "↗", keys: "photos" },
    { group: "Profiles", label: "Buy me a coffee", icon: "i-coffee", run: openUrl(LINKS.coffee), hint: "↗", keys: "support donate" },
  ];
  $$(".work-item").forEach((p) => {
    const title = $("h3", p)?.textContent.trim();
    const link = $(".work-links a", p)?.href;
    if (title && link) ITEMS.push({ group: "Projects", label: title, icon: "i-arrow-up-right", run: openUrl(link), hint: "↗" });
  });
  $$(".earlier a").forEach((a) => {
    ITEMS.push({ group: "Projects", label: $(".earlier-name", a).textContent.trim(), icon: "i-arrow-up-right", run: openUrl(a.href), hint: "↗" });
  });

  let filtered = ITEMS;
  let active = 0;
  const score = (item, q) => {
    if (!q) return 1;
    const hay = `${item.label} ${item.keys || ""} ${item.group}`.toLowerCase();
    if (item.label.toLowerCase().startsWith(q)) return 3;
    if (hay.includes(q)) return 2;
    let i = 0;
    for (const ch of hay) if (ch === q[i]) i++;
    return i === q.length ? 1 : 0;
  };
  const syncActive = () => {
    $$(".palette-option", pList).forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
    const el = $(`#pal-opt-${active}`);
    if (el) { pInput.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" }); }
    else pInput.removeAttribute("aria-activedescendant");
  };
  const renderPalette = () => {
    const q = pInput.value.trim().toLowerCase();
    filtered = ITEMS.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s > 0).sort((a, b) => (q ? b.s - a.s : 0)).map((x) => x.it);
    active = Math.min(active, Math.max(filtered.length - 1, 0));
    pList.innerHTML = "";
    if (!filtered.length) {
      pList.insertAdjacentHTML("beforeend", '<li class="palette-empty" role="presentation">No results. Try “projects” or “email”.</li>');
    }
    let lastGroup = null;
    filtered.forEach((it, i) => {
      if (!q && it.group !== lastGroup) {
        pList.insertAdjacentHTML("beforeend", `<li class="palette-group" role="presentation">${esc(it.group)}</li>`);
        lastGroup = it.group;
      }
      const li = document.createElement("li");
      li.id = `pal-opt-${i}`;
      li.className = "palette-option";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === active));
      li.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#${it.icon}"/></svg><span>${esc(it.label)}</span>${it.hint ? `<span class="hint" aria-hidden="true">${it.hint}</span>` : ""}${q ? `<span class="sr-only">, ${esc(it.group)}</span>` : ""}`;
      li.addEventListener("click", () => choose(i));
      li.addEventListener("pointermove", () => { if (active !== i) { active = i; syncActive(); } });
      pList.appendChild(li);
    });
    syncActive();
    pStatus.textContent = q ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}` : "";
  };

  let lastFocus = null;
  const openPalette = () => {
    if (!palette || palette.open) return;
    lastFocus = document.activeElement;
    pInput.value = "";
    active = 0;
    renderPalette();
    palette.showModal();
    pInput.focus();
  };
  const closePalette = () => { if (palette?.open) palette.close(); };
  const choose = (i) => {
    const it = filtered[i];
    if (!it) return;
    lastFocus = null;
    closePalette();
    it.run();
  };
  if (palette && pInput && pList) {
    palette.addEventListener("close", () => { if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); });
    palette.addEventListener("click", (e) => { if (e.target === palette) closePalette(); });
    $("[data-close-palette]", palette)?.addEventListener("click", closePalette);
    pInput.addEventListener("input", () => { active = 0; renderPalette(); });
    pInput.addEventListener("keydown", (e) => {
      const n = Math.max(filtered.length, 1);
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % n; syncActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + n) % n; syncActive(); }
      else if (e.key === "Home") { e.preventDefault(); active = 0; syncActive(); }
      else if (e.key === "End") { e.preventDefault(); active = n - 1; syncActive(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    });
    $$("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        palette.open ? closePalette() : openPalette();
      }
    });
  }

  /* =======================================================
     Kick off the intro once fonts are ready
     ======================================================= */
  const ready = () => requestAnimationFrame(() => root.classList.add("is-loaded"));
  if (document.fonts?.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(ready);
  } else ready();
})();
