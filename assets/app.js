import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const projectGrid   = document.getElementById("project-grid");
const filterRow     = document.getElementById("project-filters");
const certGrid      = document.getElementById("cert-grid");
const toastEl       = document.getElementById("toast");

// Helper: Escape HTML to prevent XSS
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

// Helper: Toast Notifications
export function showToast(msg, type = "ok") {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3400);
}

// ---------------------------------------------------------------
// FALLBACK DATA — Shown gracefully if Supabase is offline/empty
// ---------------------------------------------------------------
const FALLBACK_PROJECTS = [
  {
    title: "Smart Attendance System",
    status: "live",
    tags: ["Python", "Flask", "OpenCV", "InsightFace", "ArcFace", "SQL"],
    description: "Multi-face biometric attendance platform that extracts and identifies multiple student faces from a single high-density group photograph, cross-references them against a registered database with deduplication, and streams attendance reports directly to CSV and Excel.",
    highlights: [
      "Face detection & feature alignment via RetinaFace, InsightFace & ArcFace",
      "Dedicated role-based portals for educators and students with appeal workflows",
      "Automated duplicate-face reconciliation and attendance conflict resolution"
    ],
    repo_url: "https://github.com/Madhav-Jadon",
    demo_url: "",
  },
  {
    title: "AI Resume-to-Portfolio Generator",
    status: "in_progress",
    tags: ["AI", "Backend APIs", "Supabase", "Python"],
    description: "An automated pipeline that parses unstructured resume PDFs into semantic data models and dynamically renders personal portfolio architectures backed by Supabase storage and live database instances.",
    highlights: [
      "Semantic resume parsing into structured schema tables",
      "Real-time database-driven portfolio hydration and asset hosting",
      "Dynamic project and verified certificate management dashboard"
    ],
    repo_url: "https://github.com/Madhav-Jadon",
    demo_url: "",
  },
];

const ALL_CERTIFICATES = [
  {
    name: "Microsoft Certified: Azure Fundamentals (AZ-900)",
    issuer: "Microsoft / Certiport",
    issue_date: "May 18, 2026",
    cred_id: "Verification ID: yz9W-uTbU",
    file_url: "certificates/microsoft-azure-fundamentals-az900.pdf",
  },
  {
    name: "National Finalist in PRODUCTATHON",
    issuer: "E-Cell, IIT Roorkee (E-Summit '26)",
    issue_date: "February 2026",
    cred_id: "E-Summit '26 Finalist",
    file_url: "certificates/iit-roorkee-productathon-finalist.pdf",
  },
  {
    name: "One Shot, One Line — INNOVISION'25",
    issuer: "Netaji Subhas University of Technology (NSUT)",
    issue_date: "November 2025",
    cred_id: "ID: cmi4pfoxt000wken0sufa2t31",
    file_url: "certificates/innovision-nsut-one-shot-one-line.pdf",
  },
  {
    name: "AI Algorithm Development with Python",
    issuer: "Intel® Unnati Lab / Edulateral Foundation",
    issue_date: "October 2025",
    cred_id: "Workshop: Essentials & Implementation",
    file_url: "certificates/intel-unnati-ai-python-workshop.pdf",
  },
  {
    name: "AI Mastery: Unlocking the Power of AI",
    issuer: "NEC Corporation India & Edulateral Foundation",
    issue_date: "October 2025",
    cred_id: "Certificate No: NEC1228",
    file_url: "certificates/nec-ai-mastery-certificate.pdf",
  },
];

let allProjects = [];

// ---------------------------------------------------------------
// PROJECTS RENDERING & FILTERING — DETECTIVE CASE FILES
// ---------------------------------------------------------------
function statusLabel(status) {
  if (status === "in_progress") return { text: "Active Investigation", cls: "status-progress" };
  return { text: "Solved / Live", cls: "status-live" };
}

function renderProjects(projects) {
  if (!projectGrid) return;
  if (!projects.length) {
    projectGrid.innerHTML = `<div class="empty-state">No classified case files found in this category.</div>`;
    return;
  }

  projectGrid.innerHTML = projects.map((p, idx) => {
    const s = statusLabel(p.status);
    const tags = p.tags || [];
    const highlights = p.highlights || [];
    const caseNum = String(idx + 1).padStart(3, "0");
    return `
    <article class="card" data-tags="${esc(tags.join(",").toLowerCase())}">
      <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--bat-yellow); letter-spacing:0.12em;">CASE FILE #${caseNum} // CLASSIFIED</div>
      <div class="card-top">
        <h3 class="card-title">${esc(p.title)}</h3>
        <span class="card-status ${s.cls}">${s.text}</span>
      </div>
      <div class="card-desc">
        <p>${esc(p.description || "")}</p>
        ${highlights.length ? `<ul>${highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="tag-row">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="card-links">
        ${p.repo_url ? `<a class="chip-link" href="${esc(p.repo_url)}" target="_blank" rel="noopener">↗ Inspect Code</a>` : ""}
        ${p.demo_url ? `<a class="chip-link" href="${esc(p.demo_url)}" target="_blank" rel="noopener">↗ Launch Demo</a>` : ""}
      </div>
    </article>`;
  }).join("");

  initCardSpotlights();
  bindInteractiveCursors();
}

function buildFilters(projects) {
  if (!filterRow) return;
  const tagSet = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
  const tags = ["all", ...Array.from(tagSet)];

  filterRow.innerHTML = tags.map((t, i) =>
    `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${esc(t.toLowerCase())}">${esc(t === "all" ? "All Cases" : t)}</button>`
  ).join("");

  filterRow.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filterRow.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      const filtered = f === "all" ? allProjects : allProjects.filter(p => (p.tags || []).map(t => t.toLowerCase()).includes(f));
      renderProjects(filtered);
    });
  });
}

async function loadProjects() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    allProjects = (data && data.length) ? data : FALLBACK_PROJECTS;
  } catch (e) {
    console.warn("Supabase not reachable or empty. Displaying fallback projects.", e.message);
    allProjects = FALLBACK_PROJECTS;
  }
  buildFilters(allProjects);
  renderProjects(allProjects);
}

// ---------------------------------------------------------------
// CERTIFICATES RENDERING — WAYNE TECH CLEARANCES
// ---------------------------------------------------------------
function renderCerts(certs) {
  if (!certGrid) return;
  if (!certs.length) {
    certGrid.innerHTML = `<div class="empty-state">No credentials registered in vault.</div>`;
    return;
  }

  certGrid.innerHTML = certs.map(c => `
    <article class="cert-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="cert-icon">PDF</div>
        <span style="font-family:var(--font-mono); font-size:0.68rem; color:var(--bat-yellow); letter-spacing:0.08em; background:rgba(245,197,24,0.1); padding:3px 8px; border:1px solid var(--border-bat); border-radius:var(--radius-sm);">VERIFIED</span>
      </div>
      <div>
        <h3 class="cert-name">${esc(c.name)}</h3>
        <div class="cert-issuer">${esc(c.issuer || "Wayne Tech Security Clearance")}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; flex-wrap:wrap; gap:6px;">
          <div class="cert-date">${esc(c.issue_date || "2025")}</div>
          ${c.cred_id ? `<div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">${esc(c.cred_id)}</div>` : ""}
        </div>
      </div>
      ${c.file_url
        ? `<a class="cert-view" href="${esc(c.file_url)}" target="_blank" rel="noopener">↗ View Credential (PDF)</a>`
        : `<span class="cert-view" style="color:var(--text-muted)">Cryptographically Verified</span>`}
    </article>
  `).join("");
  bindInteractiveCursors();
}

async function loadCerts() {
  let certs = [...ALL_CERTIFICATES];
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("issue_date", { ascending: false });
    if (!error && data && data.length) {
      data.forEach(dbCert => {
        const match = certs.find(c => c.name.toLowerCase().includes(dbCert.name.toLowerCase()) || dbCert.name.toLowerCase().includes(c.name.toLowerCase()));
        if (match) {
          if (dbCert.file_url) match.file_url = dbCert.file_url;
        } else {
          certs.push(dbCert);
        }
      });
    }
  } catch (e) {
    console.warn("Supabase certificates unreachable. Displaying all vaulted credentials.", e.message);
  }
  renderCerts(certs);
}

// ---------------------------------------------------------------
// 3D PERSPECTIVE CARD TILT EFFECT (HERO BATCOMPUTER)
// ---------------------------------------------------------------
function initHeroTilt() {
  const tiltCard = document.getElementById("hero-tilt-card");
  if (!tiltCard) return;

  let bounds;
  function updateBounds() {
    bounds = tiltCard.getBoundingClientRect();
  }

  window.addEventListener("resize", updateBounds);
  updateBounds();

  tiltCard.addEventListener("mousemove", (e) => {
    if (!bounds) updateBounds();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;
    const xPct = mouseX / bounds.width - 0.5;
    const yPct = mouseY / bounds.height - 0.5;

    const rotX = -yPct * 16;
    const rotY = xPct * 16;

    tiltCard.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  tiltCard.addEventListener("mouseleave", () => {
    tiltCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  });
}

// ---------------------------------------------------------------
// CARD SPOTLIGHT MOUSE TRACKING
// ---------------------------------------------------------------
function initCardSpotlights() {
  document.querySelectorAll(".card, .stat-card, .cert-card, .focus-card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--spotlight-x", `${x}px`);
      card.style.setProperty("--spotlight-y", `${y}px`);
    });
  });
}

// ---------------------------------------------------------------
// ANIMATED NUMBER COUNTERS (ABOUT STATS)
// ---------------------------------------------------------------
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  const counterIO = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        const duration = 1800;
        const start = performance.now();

        function updateCounter(time) {
          const progress = Math.min((time - start) / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
          const currentVal = (target * easeProgress).toFixed(decimals);
          el.textContent = currentVal + suffix;
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = target.toFixed(decimals) + suffix;
          }
        }
        requestAnimationFrame(updateCounter);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => counterIO.observe(c));
}

// ---------------------------------------------------------------
// FOCUS AREA CAROUSEL (UTILITY BELT MODULES)
// ---------------------------------------------------------------
const slides = [
  [
    { icon: "⚡", cls: "c1", title: "Backend & Microservices", desc: "Flask, FastAPI, REST APIs, and Jinja — architecting robust microservices, auth, and database integrations." },
    { icon: "👁️", cls: "c2", title: "Vision & Surveillance", desc: "OpenCV, InsightFace, ArcFace, and RetinaFace — the biometric weapon behind my multi-face attendance engine." },
    { icon: "🗄️", cls: "c3", title: "Data Vaults & Schemas", desc: "PostgreSQL, DBMS fundamentals, and Supabase — transactional schemas, indexing, and real-time syncing." },
  ],
  [
    { icon: "🧠", cls: "c1", title: "Detective Foundations", desc: "Data Structures & Algorithms, Operating Systems, Computer Networks, and OOP — rock-solid engineering foundations." },
    { icon: "🛠️", cls: "c2", title: "Tactical Toolchain", desc: "Git, GitHub, Linux/WSL, VS Code, Render, and Microsoft Azure (AZ-900) — my everyday development arsenal." },
    { icon: "💬", cls: "c3", title: "Polyglot Languages", desc: "Python, Java, JavaScript (ES6+), SQL, HTML5, and CSS3 — fluent in high-reliability software construction." },
  ],
];

let slideIndex = 0;
const focusGrid = document.getElementById("focus-grid");
const pagesEl   = document.getElementById("carousel-pages");
const prevBtn   = document.getElementById("prev-focus");
const nextBtn   = document.getElementById("next-focus");

function renderSlide(i) {
  if (!focusGrid) return;
  const cards = slides[i];
  focusGrid.style.opacity = "0";
  focusGrid.style.transform = "translateY(8px)";

  setTimeout(() => {
    focusGrid.innerHTML = cards.map((c, idx) => `
      <div class="focus-card ${idx === 1 ? "featured" : ""}">
        <div class="focus-icon ${c.cls}">${c.icon}</div>
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
        <a href="#works" class="btn-split"><span class="play">▶</span> Investigate</a>
      </div>
    `).join("");

    if (pagesEl) {
      pagesEl.innerHTML = slides.map((_, idx) =>
        `<span class="${idx === i ? "active" : ""}">${String(idx + 1).padStart(2, "0")}</span>`
      ).join(" . ");
    }
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i === slides.length - 1;

    focusGrid.style.opacity = "1";
    focusGrid.style.transform = "translateY(0)";
    initCardSpotlights();
    bindInteractiveCursors();
  }, 180);
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    if (slideIndex > 0) {
      slideIndex--;
      renderSlide(slideIndex);
    }
  });
  nextBtn.addEventListener("click", () => {
    if (slideIndex < slides.length - 1) {
      slideIndex++;
      renderSlide(slideIndex);
    }
  });
}

// ---------------------------------------------------------------
// MOBILE MENU DRAWER
// ---------------------------------------------------------------
function initMobileMenu() {
  const toggleBtn = document.getElementById("nav-toggle");
  const drawer = document.getElementById("mobile-drawer");
  if (!toggleBtn || !drawer) return;

  function toggleDrawer() {
    const isOpen = drawer.classList.toggle("open");
    toggleBtn.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", isOpen);
    drawer.setAttribute("aria-hidden", !isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  toggleBtn.addEventListener("click", toggleDrawer);

  drawer.querySelectorAll(".mobile-nav-item, .nav-cta, .nav-social a").forEach(item => {
    item.addEventListener("click", () => {
      if (drawer.classList.contains("open")) {
        toggleDrawer();
      }
    });
  });
}

// ---------------------------------------------------------------
// ACTIVE NAVIGATION HIGHLIGHT ON SCROLL
// ---------------------------------------------------------------
function initActiveNav() {
  const sections = document.querySelectorAll("main > section[id], #about, #skills, #works, #certificates, #more, #contact");
  const navLinks = document.querySelectorAll(".nav-links a");
  if (!sections.length || !navLinks.length) return;

  window.addEventListener("scroll", () => {
    let current = "";
    const scrollPos = window.scrollY + 180;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }, { passive: true });
}

// ---------------------------------------------------------------
// 1-CLICK COPY EMAIL INTERACTION
// ---------------------------------------------------------------
function initCopyEmail() {
  const copyBtn = document.getElementById("copy-email-btn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.dataset.email || "madhavjadon07@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      showToast(`[ ENCRYPTED COMMS ] Copied ${email} to clipboard!`, "ok");
    } catch {
      window.location.href = `mailto:${email}`;
    }
  });
}

// ---------------------------------------------------------------
// BAT-SIGNAL CONTACT TRIGGER (FLASHLIGHT & SPOTLIGHT)
// ---------------------------------------------------------------
function initSignalTrigger() {
  const btn = document.getElementById("hero-signal-trigger");
  const flashEl = document.getElementById("lightning-flash");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (flashEl) {
      flashEl.classList.add("flash");
      setTimeout(() => flashEl.classList.remove("flash"), 120);
      setTimeout(() => flashEl.classList.add("flash"), 220);
      setTimeout(() => flashEl.classList.remove("flash"), 340);
    }
    showToast("BAT-SIGNAL TRANSMITTED ACROSS GOTHAM SKY", "ok");
  });
}

// ---------------------------------------------------------------
// LIVE LOCAL TIME (MATHURA, INDIA - IST)
// ---------------------------------------------------------------
function initLiveClock() {
  const timeEl = document.getElementById("live-time");
  if (!timeEl) return;

  function updateClock() {
    const now = new Date();
    const options = {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    timeEl.textContent = `${now.toLocaleTimeString("en-GB", options)} IST`;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ---------------------------------------------------------------
// SCROLL REVEAL (IntersectionObserver)
// ---------------------------------------------------------------
function initScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => io.observe(el));
}

// ---------------------------------------------------------------
// CUSTOM BATMAN CURSOR ENGINE
// ---------------------------------------------------------------
function initBatCursor() {
  const dot = document.getElementById("bat-cursor-dot");
  const ring = document.getElementById("bat-cursor-ring");
  if (!dot || !ring || window.matchMedia("(pointer: coarse)").matches) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function renderCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  renderCursor();
  bindInteractiveCursors();
}

function bindInteractiveCursors() {
  const ring = document.getElementById("bat-cursor-ring");
  if (!ring) return;

  const targets = document.querySelectorAll("a, button, input, select, textarea, .card, .stat-card, .cert-card, .focus-card, .tag, .pill, .contact-card");
  targets.forEach(el => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-locked"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-locked"));
  });
}

// ---------------------------------------------------------------
// GOTHAM CANVAS ATMOSPHERE (RAIN + SEARCHLIGHTS + BATS)
// ---------------------------------------------------------------
function initGothamCanvas() {
  const canvas = document.getElementById("gotham-canvas");
  const flashEl = document.getElementById("lightning-flash");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Rain Drops
  const rainCount = Math.min(80, Math.floor(width / 18));
  const raindrops = Array.from({ length: rainCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    length: Math.random() * 20 + 10,
    speed: Math.random() * 8 + 12,
    opacity: Math.random() * 0.25 + 0.08,
  }));

  // Animated Bats Swarm
  const bats = Array.from({ length: 6 }, () => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.6) + 40,
    size: Math.random() * 12 + 10,
    speedX: Math.random() * 2 + 1.5,
    speedY: Math.sin(Math.random() * Math.PI) * 1.2,
    wingAngle: 0,
    wingSpeed: Math.random() * 0.25 + 0.2,
  }));

  // Periodic Lightning Sheet
  function triggerLightning() {
    if (!flashEl) return;
    flashEl.classList.add("flash");
    setTimeout(() => flashEl.classList.remove("flash"), 90);
    if (Math.random() > 0.4) {
      setTimeout(() => flashEl.classList.add("flash"), 160);
      setTimeout(() => flashEl.classList.remove("flash"), 260);
    }
    const nextFlash = Math.random() * 14000 + 9000;
    setTimeout(triggerLightning, nextFlash);
  }
  setTimeout(triggerLightning, 6000);

  function drawBat(ctx, x, y, size, wingAngle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(10, 12, 18, 0.85)";
    
    // Draw bat wings
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const flap = Math.sin(wingAngle) * (size * 0.6);
    // Right wing
    ctx.quadraticCurveTo(size * 0.8, -size * 0.5 + flap, size * 1.6, -size * 0.2 + flap);
    ctx.quadraticCurveTo(size * 1.1, size * 0.4 + flap * 0.5, size * 0.6, size * 0.3);
    ctx.quadraticCurveTo(size * 0.2, size * 0.5, 0, size * 0.2);
    // Left wing
    ctx.quadraticCurveTo(-size * 0.2, size * 0.5, -size * 0.6, size * 0.3);
    ctx.quadraticCurveTo(-size * 1.1, size * 0.4 + flap * 0.5, -size * 1.6, -size * 0.2 + flap);
    ctx.quadraticCurveTo(-size * 0.8, -size * 0.5 + flap, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    // Draw Rain
    ctx.lineWidth = 1;
    raindrops.forEach((r) => {
      ctx.strokeStyle = `rgba(220, 230, 255, ${r.opacity})`;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 2, r.y + r.length);
      ctx.stroke();

      r.y += r.speed;
      r.x -= 1;
      if (r.y > height) {
        r.y = -20;
        r.x = Math.random() * (width + 50);
      }
    });

    // Draw Bats
    bats.forEach(b => {
      b.x += b.speedX;
      b.y += Math.sin(b.x * 0.02) * 1.2;
      b.wingAngle += b.wingSpeed;

      if (b.x > width + 40) {
        b.x = -40;
        b.y = Math.random() * (height * 0.5) + 30;
      }
      drawBat(ctx, b.x, b.y, b.size, b.wingAngle);
    });

    requestAnimationFrame(loop);
  }
  loop();
}

// ---------------------------------------------------------------
// LOADER DISMISS
// ---------------------------------------------------------------
function initLoader() {
  const loader = document.getElementById("bat-loader");
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add("loaded");
  }, 1100);
}

// ---------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  loadProjects();
  loadCerts();
  renderSlide(0);
  initHeroTilt();
  initCounters();
  initMobileMenu();
  initActiveNav();
  initCopyEmail();
  initSignalTrigger();
  initLiveClock();
  initScrollReveal();
  initBatCursor();
  initGothamCanvas();
});
