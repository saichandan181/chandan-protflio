/* =========================================================
   Sai Chandan — portfolio interactions
   Everything here is progressive enhancement: the page is
   fully readable and navigable with JavaScript turned off.
   ========================================================= */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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

  /* ---------- Motion preference ---------- */
  const osReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionOK = () => {
    const pref = root.getAttribute("data-motion");
    if (pref === "reduced") return false;
    if (pref === "full") return true;
    return !osReduced.matches;
  };
  const motionListeners = new Set();
  const onMotionChange = (fn) => motionListeners.add(fn);
  const emitMotion = () => motionListeners.forEach((fn) => fn(motionOK()));
  osReduced.addEventListener?.("change", emitMotion);

  const motionBtn = $("#motion-toggle");
  const syncMotionBtn = () => {
    if (!motionBtn) return;
    const paused = !motionOK();
    motionBtn.setAttribute("aria-pressed", String(paused));
    $("[data-motion-label]", motionBtn).textContent = paused ? "Play animations" : "Pause animations";
  };
  const toggleMotion = () => {
    const next = motionOK() ? "reduced" : "full";
    root.setAttribute("data-motion", next);
    store.set("motion", next);
    syncMotionBtn();
    emitMotion();
    toast(next === "reduced" ? "Animations paused" : "Animations playing");
  };
  motionBtn?.addEventListener("click", toggleMotion);
  syncMotionBtn();

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      setTimeout(() => { toastEl.textContent = ""; }, 400);
    }, 2600);
  }

  /* ---------- Theme ---------- */
  const themeBtn = $("#theme-toggle");
  const osLight = window.matchMedia("(prefers-color-scheme: light)");
  const currentTheme = () => root.getAttribute("data-theme") || (osLight.matches ? "light" : "dark");
  const syncThemeBtn = () => {
    const t = currentTheme();
    themeBtn?.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    $$('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", t === "dark" ? "#070b10" : "#f5f8fa");
    });
  };
  const toggleTheme = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("theme", next);
    syncThemeBtn();
    toast(`${next === "dark" ? "Dark" : "Light"} theme on`);
  };
  themeBtn?.addEventListener("click", toggleTheme);
  osLight.addEventListener?.("change", syncThemeBtn);
  syncThemeBtn();

  /* ---------- Header: scrolled state, progress bar, active link ---------- */
  const header = $(".site-header");
  const progress = $(".scroll-progress");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle("is-scrolled", y > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress?.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$(".site-nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const visible = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.intersectionRatio));
      let best = null;
      let bestRatio = 0;
      visible.forEach((r, id) => { if (r > bestRatio) { best = id; bestRatio = r; } });
      navLinks.forEach((a) => {
        if (best && a.getAttribute("href") === `#${best}`) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.01, 0.25, 0.5, 1] });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menu-toggle");
  const nav = $("#site-nav");
  const setMenu = (open, { focusBtn = false } = {}) => {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    if (open) $("a", nav)?.focus();
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
  window.matchMedia("(min-width: 861px)").addEventListener?.("change", (e) => { if (e.matches) setMenu(false); });

  /* ---------- Skip link / in-page anchors: move focus to target ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#" || id.length < 2) return;
    const target = id === "#top" ? $("#main") : $(id);
    if (!target) return;
    e.preventDefault();
    if (id === "#top" || id === "#main") window.scrollTo({ top: 0 });
    else target.scrollIntoView({ block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    window.history.replaceState(null, "", id === "#top" ? location.pathname : id);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      const i = groups.get(parent) || 0;
      groups.set(parent, i + 1);
      el.style.setProperty("--d", `${Math.min(i, 6) * 70}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
  // Content must never stay hidden: e.g. when jumping straight to an anchor or printing
  window.addEventListener("beforeprint", () => revealEls.forEach((el) => el.classList.add("is-visible")));

  /* ---------- Card spotlight (decorative) ---------- */
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  /* ---------- Role rotator ---------- */
  const ROLES = ["mobile apps", "React Native + Expo", "generative AI", "autonomous agents", "Agentforce flows", "bad puns"];
  const rotator = $("#rotator");
  let roleIdx = 0;
  let roleTimer = null;
  const stepRole = () => {
    const word = $(".rotator-word", rotator);
    if (!word) return;
    word.classList.add("is-out");
    setTimeout(() => {
      roleIdx = (roleIdx + 1) % ROLES.length;
      word.textContent = ROLES[roleIdx];
      word.classList.remove("is-out");
      word.classList.add("is-in");
      setTimeout(() => word.classList.remove("is-in"), 500);
    }, 340);
  };
  const runRotator = (on) => {
    clearInterval(roleTimer);
    roleTimer = on && rotator ? setInterval(() => { if (!document.hidden) stepRole(); }, 2600) : null;
  };
  runRotator(motionOK());
  onMotionChange(runRotator);

  /* ---------- Local time (IST) ---------- */
  const timeEl = $("#local-time");
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => {
      const now = new Date();
      timeEl.textContent = `${fmt.format(now)} IST`;
      timeEl.dateTime = now.toISOString();
    };
    tick();
    setInterval(tick, 30000);
  }
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Jokes ---------- */
  const JOKES = [
    "I told my agent to take a break. It spawned three sub-agents to plan the break.",
    "Why do Java developers wear glasses? Because they don’t C#.",
    "My model has 77% accuracy. The other 23% is a strong personality.",
    "There are 10 kinds of people: those who understand binary and those who don’t.",
    "I would tell you a UDP joke, but you might not get it.",
    "React Native: write once, debug everywhere.",
    "My code doesn’t have bugs. It has surprise features with an agentic roadmap.",
    "A SQL query walks into a bar, walks up to two tables and asks: “Can I join you?”",
    "Governor limits are just Salesforce’s way of saying “touch grass”.",
    "I asked the LLM for a joke about recursion. It asked me for a joke about recursion.",
  ];
  let jokeIdx = -1;
  const nextJoke = () => {
    let i;
    do { i = Math.floor(Math.random() * JOKES.length); } while (i === jokeIdx && JOKES.length > 1);
    jokeIdx = i;
    return JOKES[i];
  };
  const jokeBtn = $("#joke-btn");
  const jokeOut = $("#joke-out");
  jokeBtn?.addEventListener("click", () => {
    jokeOut.textContent = nextJoke();
    jokeBtn.textContent = "Another one";
  });

  /* ---------- Copy email ---------- */
  async function copyEmail() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
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
      const use = $(".icon-copy use", btn);
      if (!ok || !label) return;
      label.textContent = "Copied!";
      use?.setAttribute("href", "#i-check");
      setTimeout(() => { label.textContent = "Copy email"; use?.setAttribute("href", "#i-copy"); }, 2200);
    });
  });

  /* ---------- Stack filter ---------- */
  const stackInput = $("#stack-search");
  const stackGroups = $$(".stack-group");
  const stackCount = $("#stack-count");
  const stackEmpty = $("#stack-empty");
  const totalChips = $$(".stack-group .chips li").length;
  if (stackCount) stackCount.textContent = `${totalChips} technologies across ${stackGroups.length} areas.`;
  let stackTimer;
  stackInput?.addEventListener("input", () => {
    clearTimeout(stackTimer);
    stackTimer = setTimeout(() => {
      const q = stackInput.value.trim().toLowerCase();
      let matches = 0;
      stackGroups.forEach((g) => {
        let groupHit = 0;
        const groupName = $("h3", g).textContent.toLowerCase();
        $$(".chips li", g).forEach((li) => {
          const hit = q && (li.textContent.toLowerCase().includes(q) || groupName.includes(q));
          li.classList.toggle("is-match", Boolean(hit));
          li.classList.toggle("is-dim", Boolean(q) && !hit);
          if (hit) groupHit++;
        });
        g.hidden = Boolean(q) && groupHit === 0;
        matches += groupHit;
      });
      if (stackEmpty) stackEmpty.hidden = !(q && matches === 0);
      if (stackCount) {
        stackCount.textContent = !q
          ? `${totalChips} technologies across ${stackGroups.length} areas.`
          : matches === 0 ? `No matches for “${q}”.` : `${matches} match${matches === 1 ? "" : "es"} for “${q}”.`;
      }
    }, 120);
  });

  /* ---------- Project filters ---------- */
  const filterBtns = $$(".filter");
  const projects = $$(".project");
  const workStatus = $("#work-status");
  const applyFilter = (key) => {
    let shown = 0;
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
    projects.forEach((p) => {
      const show = key === "all" || p.dataset.tags.split(" ").includes(key);
      p.hidden = !show;
      if (show) { shown++; p.classList.add("is-visible"); }
    });
    const label = filterBtns.find((b) => b.dataset.filter === key)?.textContent.trim();
    if (workStatus) workStatus.textContent = `Showing ${shown} ${shown === 1 ? "project" : "projects"}${key === "all" ? "" : ` in ${label}`}.`;
  };
  filterBtns.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.filter)));

  /* ---------- Live GitHub data (stars + language), best effort ---------- */
  const repoCards = $$("[data-repo]");
  if (repoCards.length && "fetch" in window) {
    const CACHE_KEY = "gh-repos-v1";
    const paint = (repos) => {
      const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
      repoCards.forEach((card) => {
        const r = byName.get(card.dataset.repo.toLowerCase());
        if (!r) return;
        const lang = $("[data-lang]", card);
        if (lang && r.language) lang.textContent = r.language;
        const stars = $("[data-stars]", card);
        if (stars && r.stargazers_count > 0) {
          stars.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>${r.stargazers_count}<span class="sr-only"> GitHub stars</span>`;
          stars.hidden = false;
        }
      });
    };
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null"); } catch { /* ignore */ }
    if (cached) paint(cached);
    else {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      fetch("https://api.github.com/users/saichandan181/repos?per_page=100", { signal: ctrl.signal, headers: { Accept: "application/vnd.github+json" } })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data) => {
          if (!Array.isArray(data)) return;
          const slim = data.map(({ name, language, stargazers_count }) => ({ name, language, stargazers_count }));
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(slim)); } catch { /* ignore */ }
          paint(slim);
        })
        .catch(() => { /* offline or rate-limited — static content already rendered */ });
    }
  }

  /* ---------- Hero canvas: an "agent network" ---------- */
  const canvas = $(".hero-canvas");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, nodes = [], raf = null, inView = true;
    const pointer = { x: -9999, y: -9999 };

    const colors = () => {
      const light = currentTheme() === "light";
      return {
        node: light ? "rgba(3,105,161,0.55)" : "rgba(54,188,247,0.75)",
        hot: light ? "rgba(4,120,87,0.9)" : "rgba(122,240,196,0.95)",
        line: light ? "3,105,161" : "54,188,247",
      };
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, Math.max(28, (w * h) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
        pulse: Math.random() * Math.PI * 2,
      }));
      draw(false);
    };

    const LINK = 130;
    const draw = (step) => {
      const c = colors();
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        if (step) {
          n.x += n.vx; n.y += n.vy; n.pulse += 0.03;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
          const dx = n.x - pointer.x, dy = n.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140 && d2 > 1) { // gentle repel around the pointer
            const f = (1 - Math.sqrt(d2) / 140) * 0.6;
            n.x += (dx / Math.sqrt(d2)) * f;
            n.y += (dy / Math.sqrt(d2)) * f;
          }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${c.line},${(1 - d / LINK) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const near = Math.hypot(n.x - pointer.x, n.y - pointer.y) < 160;
        ctx.fillStyle = near ? c.hot : c.node;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (near ? 1.2 : Math.sin(n.pulse) * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => { draw(true); raf = requestAnimationFrame(loop); };
    const start = () => { if (!raf && inView && !document.hidden && motionOK()) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });

    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }).observe(hero);
    }
    onMotionChange((on) => (on ? start() : (stop(), draw(false))));
    themeBtn?.addEventListener("click", () => { if (!raf) draw(false); });

    resize();
    start();
  }

  /* ---------- Interactive terminal ---------- */
  const tLog = $("#terminal-log");
  const tForm = $("#terminal-form");
  const tInput = $("#terminal-input");
  const tBody = $("#terminal-body");
  const cmdHistory = [];
  let histIdx = -1;

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in new tab)</span></a>`;

  const COMMANDS = {
    help: {
      desc: "list commands",
      run: () => Object.entries(COMMANDS)
        .filter(([, c]) => !c.hidden)
        .map(([k, c]) => `<span class="t-accent">${k.padEnd(10)}</span> ${c.desc}`)
        .join("\n"),
    },
    whoami: { desc: "who is this guy?", run: () => "Sai Chandan — mobile app developer & AI/ML engineer.\nI make agents do the boring part." },
    skills: {
      desc: "what I work with",
      run: () => [
        `<span class="t-accent">mobile</span>    React Native · Expo · EAS · Expo Router`,
        `<span class="t-accent">ai/ml</span>     PyTorch · TensorFlow · scikit-learn · OpenCV`,
        `<span class="t-accent">agents</span>    Claude Agent SDK · Gemini · MCP · Agentforce`,
        `<span class="t-accent">web</span>       React · Next.js · Tailwind · Node · FastAPI`,
        `<span class="t-accent">data</span>      Postgres · MongoDB · MySQL · Supabase`,
        `<span class="t-accent">cloud</span>     AWS · Vercel · Docker · GitHub Actions`,
      ].join("\n"),
    },
    projects: {
      desc: "featured work",
      run: () => $$(".project h3").map((h, i) => `${String(i + 1).padStart(2, "0")}  ${esc(h.textContent)}`).join("\n") + `\n\n<a href="#work">Jump to the Work section</a> · or try <code>open github</code>`,
    },
    now: { desc: "what I’m learning", run: () => $$(".learning h3").map((h) => `→ ${esc(h.textContent)}`).join("\n") },
    contact: { desc: "say hi", run: () => `email     <a href="mailto:${EMAIL}">${EMAIL}</a>\nlinkedin  ${ext(LINKS.linkedin, "reddy-sai-chandan")}\nx         ${ext(LINKS.x, "@saichandan181")}` },
    socials: { desc: "find me online", run: () => Object.entries(LINKS).map(([k, v]) => `${k.padEnd(10)}${ext(v, v.replace(/^https?:\/\/(www\.)?/, ""))}`).join("\n") },
    open: {
      desc: "open github | linkedin | x | instagram | resume",
      run: (arg) => {
        const key = (arg || "").toLowerCase();
        const url = key === "resume" ? RESUME : LINKS[key === "twitter" ? "x" : key];
        if (!url) return `<span class="t-err">usage: open github | linkedin | x | instagram | resume</span>`;
        window.open(url, "_blank", "noopener");
        return `Opening ${esc(key)} in a new tab…`;
      },
    },
    philosophy: { desc: "my one rule", run: () => "“If I do it twice, an agent should do it the third time.”" },
    joke: { desc: "I think I am funny", run: () => esc(nextJoke()) },
    theme: { desc: "toggle light / dark", run: () => { toggleTheme(); return `Theme set to ${currentTheme()}.`; } },
    date: { desc: "local time in Bengaluru", run: () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" }) + " IST" },
    clear: { desc: "clear the screen", run: () => { tLog.innerHTML = ""; return null; } },
    sudo: {
      hidden: true,
      run: (arg) => (arg === "hire-me" || arg === "hire me")
        ? `[sudo] password for recruiter: ********\n<span class="t-accent">✔ Access granted.</span> Great choice.\nDrafting an email to <a href="mailto:${EMAIL}?subject=Let%E2%80%99s%20work%20together">${EMAIL}</a>…`
        : `<span class="t-err">Nice try. This incident will be reported.</span>`,
    },
    ls: { hidden: true, run: () => "about.yaml  projects/  skills.json  secrets.txt" },
    cat: { hidden: true, run: (arg) => arg === "secrets.txt" ? "I still google how to center a div. 🤫" : arg === "about.yaml" ? "Scroll up — it’s right there 👆" : `<span class="t-err">cat: ${esc(arg || "")}: No such file</span>` },
    rm: { hidden: true, run: () => `<span class="t-err">Permission denied. Nice try though.</span>` },
    hello: { hidden: true, run: () => "Hey there 👋 — type <code>help</code> to look around." },
    exit: { hidden: true, run: () => "There is no escape. Only <code>help</code>." },
  };
  COMMANDS.hi = COMMANDS.hello;
  COMMANDS.hire = { hidden: true, run: () => COMMANDS.sudo.run("hire-me") };

  const print = (cmd, html) => {
    const line = document.createElement("div");
    line.className = "t-line";
    line.innerHTML = `<span class="t-prompt" aria-hidden="true">❯</span> <span class="t-cmd">${esc(cmd)}</span>`;
    tLog.appendChild(line);
    if (html) {
      const out = document.createElement("pre");
      out.className = "t-out";
      out.innerHTML = html;
      tLog.appendChild(out);
    }
    tLog.scrollTop = tLog.scrollHeight;
  };

  const runCommand = (raw) => {
    const input = raw.trim();
    if (!input) return;
    cmdHistory.unshift(input);
    histIdx = -1;
    const [name, ...rest] = input.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    if (!cmd) {
      print(input, `<span class="t-err">command not found: ${esc(name)}</span> — try <code>help</code>`);
      return;
    }
    const out = cmd.run(rest.join(" ").toLowerCase());
    if (out === null) return; // clear
    print(input, out);
  };

  if (tForm && tInput && tLog) {
    tForm.addEventListener("submit", (e) => {
      e.preventDefault();
      runCommand(tInput.value);
      tInput.value = "";
    });
    tInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && cmdHistory.length) {
        e.preventDefault();
        histIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
        tInput.value = cmdHistory[histIdx];
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        histIdx = Math.max(histIdx - 1, -1);
        tInput.value = histIdx === -1 ? "" : cmdHistory[histIdx];
      } else if (e.key === "Tab" && tInput.value.trim()) {
        const partial = tInput.value.trim().toLowerCase();
        const match = Object.keys(COMMANDS).find((k) => !COMMANDS[k].hidden && k.startsWith(partial));
        if (match && match !== partial) { e.preventDefault(); tInput.value = match + " "; }
      }
    });
    // Clicking empty terminal space focuses the prompt (but don't steal clicks on links / text selection)
    tBody?.addEventListener("click", (e) => {
      if (e.target.closest("a") || window.getSelection()?.toString()) return;
      tInput.focus({ preventScroll: true });
    });
    $$(".terminal-chips [data-cmd]").forEach((b) => b.addEventListener("click", () => runCommand(b.dataset.cmd)));
  }

  /* ---------- Command palette ---------- */
  const palette = $("#palette");
  const pInput = $("#palette-input");
  const pList = $("#palette-list");
  const pStatus = $("#palette-status");
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$("[data-mod-key]").forEach((k) => { k.textContent = isMac ? "⌘ K" : "Ctrl K"; });

  const go = (hash) => () => {
    const el = $(hash);
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    window.history.replaceState?.(null, "", hash);
  };
  const openUrl = (url) => () => window.open(url, "_blank", "noopener");

  const ITEMS = [
    { group: "Go to", label: "About", icon: "i-arrow-right", run: go("#about"), keys: "who bio" },
    { group: "Go to", label: "Stack", icon: "i-arrow-right", run: go("#stack"), keys: "skills tech tools" },
    { group: "Go to", label: "Work", icon: "i-arrow-right", run: go("#work"), keys: "projects portfolio" },
    { group: "Go to", label: "Now", icon: "i-arrow-right", run: go("#now"), keys: "learning ask" },
    { group: "Go to", label: "Contact", icon: "i-arrow-right", run: go("#contact"), keys: "email hire" },
    { group: "Actions", label: "Copy email address", icon: "i-copy", run: copyEmail, keys: "mail clipboard" },
    { group: "Actions", label: "Send an email", icon: "i-mail", run: () => { location.href = `mailto:${EMAIL}`; }, keys: "mail contact" },
    { group: "Actions", label: "Download résumé (PDF)", icon: "i-file", run: () => { const a = document.createElement("a"); a.href = RESUME; a.download = "Sai-Chandan-Resume.pdf"; a.click(); }, keys: "cv resume" },
    { group: "Actions", label: "Toggle light / dark theme", icon: "i-sun", run: toggleTheme, keys: "dark light mode color" },
    { group: "Actions", label: "Pause or play animations", icon: "i-pause", run: toggleMotion, keys: "motion reduce accessibility" },
    { group: "Actions", label: "Open the terminal", icon: "i-terminal", run: () => { tInput?.scrollIntoView({ block: "center" }); tInput?.focus({ preventScroll: true }); }, keys: "cli shell command" },
    { group: "Actions", label: "Tell me a joke", icon: "i-smile", run: () => toast(nextJoke()), keys: "funny fun" },
    { group: "Profiles", label: "GitHub", icon: "i-github", run: openUrl(LINKS.github), hint: "↗", keys: "code repos" },
    { group: "Profiles", label: "LinkedIn", icon: "i-linkedin", run: openUrl(LINKS.linkedin), hint: "↗", keys: "work" },
    { group: "Profiles", label: "X (Twitter)", icon: "i-x", run: openUrl(LINKS.x), hint: "↗", keys: "twitter" },
    { group: "Profiles", label: "Instagram", icon: "i-instagram", run: openUrl(LINKS.instagram), hint: "↗", keys: "photos" },
    { group: "Profiles", label: "Buy me a coffee", icon: "i-coffee", run: openUrl(LINKS.coffee), hint: "↗", keys: "support donate" },
  ];
  $$(".project").forEach((p) => {
    const title = $("h3", p)?.textContent.trim();
    const link = $(".project-links a", p)?.href;
    if (title && link) ITEMS.push({ group: "Projects", label: title, icon: "i-arrow-up-right", run: openUrl(link), hint: "↗", keys: p.dataset.tags });
  });

  let filtered = ITEMS;
  let active = 0;

  const score = (item, q) => {
    if (!q) return 1;
    const hay = `${item.label} ${item.keys || ""} ${item.group}`.toLowerCase();
    if (item.label.toLowerCase().startsWith(q)) return 3;
    if (hay.includes(q)) return 2;
    // loose subsequence match
    let i = 0;
    for (const ch of hay) if (ch === q[i]) i++;
    return i === q.length ? 1 : 0;
  };

  const renderPalette = () => {
    const q = pInput.value.trim().toLowerCase();
    filtered = ITEMS.map((it) => ({ it, s: score(it, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0))
      .map((x) => x.it);
    active = Math.min(active, Math.max(filtered.length - 1, 0));
    pList.innerHTML = "";
    if (!filtered.length) {
      const li = document.createElement("li");
      li.className = "palette-empty";
      li.setAttribute("role", "presentation");
      li.textContent = "No results. Try “projects” or “email”.";
      pList.appendChild(li);
      pInput.removeAttribute("aria-activedescendant");
    }
    let lastGroup = null;
    filtered.forEach((it, i) => {
      if (!q && it.group !== lastGroup) {
        const g = document.createElement("li");
        g.className = "palette-group";
        g.setAttribute("role", "presentation");
        g.textContent = it.group;
        pList.appendChild(g);
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

  const syncActive = () => {
    $$(".palette-option", pList).forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
    const el = $(`#pal-opt-${active}`);
    if (el) {
      pInput.setAttribute("aria-activedescendant", el.id);
      el.scrollIntoView({ block: "nearest" });
    }
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
    lastFocus = null; // the action decides where focus goes
    closePalette();
    it.run();
  };

  if (palette && pInput && pList) {
    palette.addEventListener("close", () => {
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    });
    palette.addEventListener("click", (e) => { if (e.target === palette) closePalette(); }); // backdrop
    $("[data-close-palette]", palette)?.addEventListener("click", closePalette);
    pInput.addEventListener("input", () => { active = 0; renderPalette(); });
    pInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(filtered.length, 1); syncActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + filtered.length) % Math.max(filtered.length, 1); syncActive(); }
      else if (e.key === "Home") { e.preventDefault(); active = 0; syncActive(); }
      else if (e.key === "End") { e.preventDefault(); active = Math.max(filtered.length - 1, 0); syncActive(); }
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
})();
