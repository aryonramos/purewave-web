/* =================================================================
 * PUREWAVE — v5 site logic
 * Photo-backed 3D scenes (real product photos as backdrop, 3D disc
 * + EMF/shield overlays). Scroll moments throughout the page.
 * Mobile-friendly with reduced DPR.
 * ================================================================= */
(function () {
  "use strict";

  /* ---------- env detection ---------- */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;
  var isMobile = window.innerWidth < 700;
  var isTinyMobile = window.innerWidth < 360;
  // DPR cap — lower on mobile to save battery, but still high enough to look sharp
  var DPR_CAP = isMobile ? 1.5 : 2.0;

  /* ---------- math helpers ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInCubic(t) { return t * t * t; }
  function smoothstep(a, b, t) { var x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }

  /* =================================================================
   * SMOOTH SCROLL
   * ================================================================= */
  function initSmoothScroll() {
    if (isTouch || prefersReducedMotion) {
      window.__pwSmoothY = window.scrollY;
      window.addEventListener("scroll", function () { window.__pwSmoothY = window.scrollY; }, { passive: true });
      return;
    }
    var current = window.scrollY;
    var raf = null;
    function tick() {
      var target = window.scrollY;
      current = lerp(current, target, 0.1);
      if (Math.abs(current - target) > 0.1) {
        window.__pwSmoothY = current;
        raf = requestAnimationFrame(tick);
      } else {
        window.__pwSmoothY = target;
        raf = null;
      }
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    window.__pwSmoothY = window.scrollY;
  }

  /* =================================================================
   * SCROLL PROGRESS BAR
   * ================================================================= */
  function initScrollProgress() {
    var bar = document.querySelector("[data-scroll-progress]");
    if (!bar) return;
    var raf = null;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * SCROLL REVEAL — wider coverage now
   * ================================================================= */
  function initScrollReveal() {
    var tagMap = [
      [".problem-card", "reveal-up", 100],
      [".how-step", "reveal-up", 120],
      [".review", "reveal-up", 80],
      [".solution-features li", "reveal-left", 80],
      [".bundle", "reveal-up", 80],
      [".showcase-item", "reveal-scale", 100],
      [".compare-row:not(.head)", "reveal-up", 40],
      [".faq-item", "reveal-up", 40],
      [".og-item", "reveal-up", 60],
      [".rs-item", "reveal-up", 80],
      [".section-eyebrow", "reveal-up", 0],
      [".pay-badge", "reveal-scale", 50],
      [".footer-col", "reveal-up", 100]
    ];
    tagMap.forEach(function (entry) {
      var sel = entry[0], cls = entry[1], stagger = entry[2];
      document.querySelectorAll(sel).forEach(function (el, i) {
        el.classList.add(cls);
        if (stagger) el.style.transitionDelay = (i * stagger) + "ms";
      });
    });
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal-up, .reveal-left, .reveal-scale").forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll(".reveal-up, .reveal-left, .reveal-scale").forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
   * SPLIT TEXT
   * ================================================================= */
  function initSplitText() {
    if (prefersReducedMotion) return;
    var els = document.querySelectorAll("[data-split-text]");
    if (!els.length) return;
    els.forEach(function (el) {
      var html = el.innerHTML;
      var parts = html.split(/<br\s*\/?>/i);
      el.innerHTML = parts.map(function (line) {
        return '<span class="pw-split-line"><span class="pw-split-line-inner">' + line.trim() + '</span></span>';
      }).join("");
    });
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".pw-split-line").forEach(function (l) { l.classList.add("is-revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var lines = e.target.querySelectorAll(".pw-split-line");
        lines.forEach(function (line, i) {
          line.querySelector(".pw-split-line-inner").style.transitionDelay = (i * 90) + "ms";
          requestAnimationFrame(function () { line.classList.add("is-revealed"); });
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
   * COUNTDOWN
   * ================================================================= */
  function initCountdown() {
    var bar = document.querySelector("[data-countdown]");
    if (!bar) return;
    var hEl = bar.querySelector("[data-cd-h]");
    var mEl = bar.querySelector("[data-cd-m]");
    var sEl = bar.querySelector("[data-cd-s]");
    var endKey = "pw_offer_end_v6";
    var DURATION = (23 * 3600 + 47 * 60 + 12) * 1000;
    var end = 0;
    try { end = parseInt(sessionStorage.getItem(endKey) || "0", 10); } catch (e) {}
    if (!end || end < Date.now()) {
      end = Date.now() + DURATION;
      try { sessionStorage.setItem(endKey, String(end)); } catch (e) {}
    }
    function pad(n) { return String(n).padStart(2, "0"); }
    function tick() {
      var diff = Math.max(0, end - Date.now());
      if (diff === 0) { bar.style.display = "none"; return; }
      if (hEl) hEl.textContent = pad(Math.floor(diff / 3600000));
      if (mEl) mEl.textContent = pad(Math.floor((diff % 3600000) / 60000));
      if (sEl) sEl.textContent = pad(Math.floor((diff % 60000) / 1000));
    }
    tick();
    setInterval(tick, 1000);
  }

  /* =================================================================
   * BUNDLE SELECTOR
   * ================================================================= */
  var BUNDLES = {
    "1": { qty: "6×", label: "Starter Pack", now: 59, was: 118 },
    "2": { qty: "12×", label: "Household Pack", now: 89, was: 178 },
    "3": { qty: "18×", label: "Family Pack", now: 119, was: 238 }
  };
  function initBundleSelector() {
    var cards = document.querySelectorAll("[data-bundle]");
    var variantInput = document.querySelector("[data-bundle-variant-input]");
    var ctaText = document.querySelector("[data-bundle-cta-text]");
    if (!cards.length) return;
    function select(key) {
      var b = BUNDLES[key]; if (!b) return;
      cards.forEach(function (card) {
        var active = card.getAttribute("data-bundle") === key;
        card.classList.toggle("active", active);
        card.setAttribute("aria-pressed", active);
      });
      if (variantInput) variantInput.value = variantInput.getAttribute("data-variant-" + key) || variantInput.value;
      if (ctaText) ctaText.textContent = "Add To Cart \u00B7 $" + b.now.toFixed(2) + " USD";
      var sLabel = document.querySelector("[data-sticky-label]");
      var sWas = document.querySelector("[data-sticky-was]");
      var sNow = document.querySelector("[data-sticky-now]");
      var sBtnL = document.querySelector("[data-sticky-btn-long]");
      var sBtnS = document.querySelector("[data-sticky-btn-short]");
      if (sLabel) sLabel.textContent = "PureWave " + b.label;
      if (sWas) sWas.textContent = "$" + b.was;
      if (sNow) sNow.textContent = "$" + b.now + " USD";
      if (sBtnL) sBtnL.textContent = "Add to Cart \u00B7 $" + b.now;
      if (sBtnS) sBtnS.textContent = "Buy $" + b.now;
    }
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var key = card.getAttribute("data-bundle");
        if (key) select(key);
      });
    });
    select("2");
  }

  /* =================================================================
   * STICKY CART
   * ================================================================= */
  function initStickyCart() {
    var bar = document.querySelector("[data-sticky-cart]");
    if (!bar) return;
    function onScroll() { bar.classList.toggle("visible", window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* =================================================================
   * LIVE NOTIFICATIONS
   * ================================================================= */
  var purchases = [
    { name: "Sarah", city: "Austin, TX", product: "Household Pack", time: "12 min ago" },
    { name: "Michael", city: "Chicago, IL", product: "Family Pack", time: "8 min ago" },
    { name: "Emma", city: "Denver, CO", product: "Starter Pack", time: "5 min ago" },
    { name: "Jake", city: "Seattle, WA", product: "Household Pack", time: "3 min ago" },
    { name: "Lauren", city: "Phoenix, AZ", product: "Family Pack", time: "1 min ago" },
    { name: "Ryan", city: "Nashville, TN", product: "Household Pack", time: "just now" },
    { name: "Olivia", city: "Portland, OR", product: "Starter Pack", time: "4 min ago" },
    { name: "Marcus", city: "San Diego, CA", product: "Family Pack", time: "7 min ago" }
  ];
  function initLiveNotif() {
    var notif = document.querySelector("[data-live-notif]");
    if (!notif) return;
    var avatar = notif.querySelector("[data-live-avatar]");
    var text = notif.querySelector("[data-live-text]");
    var idx = 0;
    function show() {
      var p = purchases[idx % purchases.length];
      if (avatar) avatar.textContent = p.name[0];
      if (text) text.innerHTML = "<b>" + p.name + " from " + p.city + "</b><br>" +
        "<span style=\"color:#6a6b72\">ordered the " + p.product + "</span><br>" +
        "<span style=\"color:#9a9ba0;font-size:11px\">" + p.time + "</span>";
      notif.classList.add("show");
      setTimeout(function () { notif.classList.remove("show"); }, 4500);
      idx++;
    }
    setTimeout(function () { show(); setInterval(show, 14000); }, 7000);
  }

  /* =================================================================
   * COUNTERS — animate numbers when in view
   * ================================================================= */
  function initCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var hasComma = target >= 1000 && decimals === 0;
      var duration = 1700;
      var start = performance.now();
      function step(now) {
        var t = Math.min(1, (now - start) / duration);
        var v = target * easeOutCubic(t);
        var display;
        if (decimals > 0) display = v.toFixed(decimals);
        else if (hasComma) display = Math.floor(v).toLocaleString();
        else display = Math.floor(v);
        el.textContent = prefix + display + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
   * PARALLAX IMAGES
   * ================================================================= */
  function initParallaxImages() {
    if (prefersReducedMotion) return;
    var wraps = document.querySelectorAll("[data-parallax-image]");
    if (!wraps.length) return;
    var items = [];
    wraps.forEach(function (wrap) {
      var img = wrap.querySelector("img");
      if (!img) return;
      img.style.transform = "translate3d(0,0,0) scale(1.1)";
      var strength = parseFloat(wrap.getAttribute("data-parallax-strength") || "28");
      items.push({ wrap: wrap, img: img, strength: strength });
    });
    var raf = null;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var rect = it.wrap.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var center = rect.top + rect.height / 2;
        var p = (center - vh / 2) / vh;
        var y = clamp(p * -it.strength, -60, 60);
        it.img.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) scale(1.1)";
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * BAR FILL
   * ================================================================= */
  function initBarFill() {
    var els = document.querySelectorAll("[data-bar-fill]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var fill = e.target.getAttribute("data-bar-fill");
          var inner = e.target.querySelector(".feature-bar-fill");
          if (inner) inner.style.width = fill;
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
   * MARQUEE PARALLAX — horizontal track shifts based on scroll
   * Adds dynamic life to the marquee bands
   * ================================================================= */
  function initMarqueeParallax() {
    if (prefersReducedMotion) return;
    var marquees = document.querySelectorAll("[data-marquee-scroll]");
    if (!marquees.length) return;
    var raf = null;
    function update() {
      var vh = window.innerHeight;
      marquees.forEach(function (m) {
        var rect = m.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        // Shift extra based on viewport progress
        var p = 1 - rect.top / vh;
        var track = m.querySelector(".marquee-track");
        if (!track) return;
        // Apply an additional translate via a CSS variable
        m.style.setProperty("--marquee-offset", (p * -60).toFixed(0) + "px");
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * SCROLL-TIED CARD TILT — cards tilt slightly based on scroll position
   * Subtle, gives the feed a feeling of motion
   * ================================================================= */
  function initScrollTilt() {
    if (prefersReducedMotion || isMobile) return;
    var cards = document.querySelectorAll("[data-scroll-tilt]");
    if (!cards.length) return;
    var raf = null;
    function update() {
      var vh = window.innerHeight;
      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var center = rect.top + rect.height / 2;
        var p = (center - vh / 2) / (vh / 2);
        var rotX = clamp(p * 4, -8, 8);
        card.style.transform = "perspective(900px) rotateX(" + (-rotX).toFixed(2) + "deg)";
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * SCROLL-DRIVEN STAT BARS — review stat bars fill based on scroll
   * ================================================================= */
  function initScrollStats() {
    if (!("IntersectionObserver" in window)) return;
    var bars = document.querySelectorAll("[data-scroll-stat]");
    if (!bars.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var fill = e.target.getAttribute("data-scroll-stat") || "85%";
          var inner = e.target.querySelector(".stat-bar-fill");
          if (inner) {
            // Slightly delayed for a satisfying load
            setTimeout(function () { inner.style.width = fill; }, 200);
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    bars.forEach(function (b) { io.observe(b); });
  }

  /* =================================================================
   * MAGNETIC BUTTONS — small mouse-follow effect
   * ================================================================= */
  function initMagneticButtons() {
    if (prefersReducedMotion || isTouch) return;
    var els = document.querySelectorAll("[data-magnetic]");
    els.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
        el.style.transform = "translate(" + dx + "px, " + dy + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  /* =================================================================
   * THREE.JS — DISC, EMF WAVES, SHIELD FIELD (no procedural phone)
   * ================================================================= */

  function buildPureWaveDisc(THREE) {
    var disc = new THREE.Group();
    var radius = 1.0, thickness = 0.085;
    var holoMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0xf6c942) },
        uColorB: { value: new THREE.Color(0xb6e25b) },
        uColorC: { value: new THREE.Color(0xffe89a) },
        uColorD: { value: new THREE.Color(0xb8872c) }
      },
      vertexShader: [
        "varying vec3 vNormal;",
        "varying vec3 vViewDir;",
        "varying vec2 vUv;",
        "void main(){",
        "  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);",
        "  vNormal = normalize(normalMatrix * normal);",
        "  vViewDir = normalize(-mvPos.xyz);",
        "  vUv = uv;",
        "  gl_Position = projectionMatrix * mvPos;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uTime;",
        "uniform vec3 uColorA, uColorB, uColorC, uColorD;",
        "varying vec3 vNormal;",
        "varying vec3 vViewDir;",
        "varying vec2 vUv;",
        "void main(){",
        "  float fres = 1.0 - max(dot(vNormal, vViewDir), 0.0);",
        "  fres = pow(fres, 1.6);",
        "  vec2 cuv = vUv - 0.5;",
        "  float r = length(cuv);",
        "  float a = atan(cuv.y, cuv.x);",
        "  float shift = sin(a * 3.0 + uTime * 0.3) * 0.5 + 0.5;",
        "  vec3 holo = mix(uColorA, uColorB, shift);",
        "  holo = mix(holo, uColorC, smoothstep(0.0, 0.6, fres));",
        "  float darkRing = smoothstep(0.42, 0.34, r);",
        "  vec3 finalCol = mix(holo, uColorD * 0.4, darkRing * 0.3);",
        "  float sweep = smoothstep(0.0, 0.1, sin(a * 2.0 + uTime * 0.6) * 0.5 + 0.5);",
        "  finalCol += vec3(0.18) * sweep * (1.0 - r);",
        "  gl_FragColor = vec4(finalCol, 1.0);",
        "}"
      ].join("\n")
    });
    var bodyGeo = new THREE.CylinderGeometry(radius, radius, thickness, 96, 1, false);
    disc.add(new THREE.Mesh(bodyGeo, holoMat));

    var innerGeo = new THREE.CircleGeometry(0.62, 96);
    var innerMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.55, metalness: 0.2 });
    var innerTop = new THREE.Mesh(innerGeo, innerMat);
    innerTop.rotation.x = -Math.PI / 2;
    innerTop.position.y = thickness / 2 + 0.001;
    disc.add(innerTop);
    var innerBot = new THREE.Mesh(innerGeo, innerMat);
    innerBot.rotation.x = Math.PI / 2;
    innerBot.position.y = -thickness / 2 - 0.001;
    disc.add(innerBot);

    var dotMat = new THREE.MeshBasicMaterial({ color: 0xf3c956 });
    var bigDot = new THREE.CircleGeometry(0.06, 32);
    var midDot = new THREE.CircleGeometry(0.045, 24);
    var smDot = new THREE.CircleGeometry(0.03, 24);
    function addDot(geo, x, z, faceY) {
      var m = new THREE.Mesh(geo, dotMat);
      m.rotation.x = -Math.PI / 2 * Math.sign(faceY);
      m.position.set(x, faceY, z);
      disc.add(m);
    }
    function constellation(faceY) {
      var s = Math.sign(faceY);
      addDot(bigDot, 0, 0, faceY);
      for (var i = 0; i < 8; i++) {
        var ang = (i / 8) * Math.PI * 2;
        var cx = Math.cos(ang), cz = Math.sin(ang);
        addDot(midDot, cx * 0.18 * s, cz * 0.18, faceY);
        addDot(midDot, cx * 0.32 * s, cz * 0.32, faceY);
        addDot(smDot, cx * 0.46 * s, cz * 0.46, faceY);
      }
    }
    constellation(thickness / 2 + 0.0025);
    constellation(-thickness / 2 - 0.0025);

    var rimGeo = new THREE.TorusGeometry(radius - 0.005, 0.012, 12, 96);
    var rimMat = new THREE.MeshStandardMaterial({ color: 0xffe18a, roughness: 0.15, metalness: 0.95, emissive: 0x6a4a10, emissiveIntensity: 0.4 });
    var rimTop = new THREE.Mesh(rimGeo, rimMat);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.y = thickness / 2;
    disc.add(rimTop);
    var rimBot = new THREE.Mesh(rimGeo, rimMat);
    rimBot.rotation.x = Math.PI / 2;
    rimBot.position.y = -thickness / 2;
    disc.add(rimBot);

    return { group: disc, holoMat: holoMat };
  }

  function buildEMFWaves(THREE) {
    var group = new THREE.Group();
    var ringMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uChaos: { value: 1.0 },
        uColorChaos: { value: new THREE.Color(0xff5a3c) },
        uColorCalm: { value: new THREE.Color(0x6ec3ff) },
        uColorGold: { value: new THREE.Color(0xffd770) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: [
        "uniform float uTime;",
        "uniform float uChaos;",
        "attribute float aRingIndex;",
        "varying float vAlpha;",
        "varying vec2 vUv;",
        "varying float vDistortion;",
        "void main(){",
        "  vUv = uv;",
        "  float ringT = mod(uTime * 0.4 + aRingIndex * 0.13, 1.0);",
        "  float radiusMul = 0.4 + ringT * 2.6;",
        "  float angle = atan(position.z, position.x);",
        "  float baseR = length(position.xz);",
        "  float jitter = (sin(angle * 7.0 + uTime * 3.0 + aRingIndex * 1.7) * 0.5",
        "                + sin(angle * 13.0 - uTime * 4.5) * 0.25",
        "                + sin(angle * 3.0 + uTime * 1.5 + aRingIndex) * 0.2);",
        "  float distortion = jitter * uChaos * 0.45;",
        "  vDistortion = distortion;",
        "  float newR = baseR * radiusMul * (1.0 + distortion);",
        "  vec3 newPos = vec3(cos(angle) * newR, position.y, sin(angle) * newR);",
        "  vAlpha = (1.0 - ringT) * smoothstep(0.0, 0.15, ringT);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uChaos;",
        "uniform vec3 uColorChaos;",
        "uniform vec3 uColorCalm;",
        "uniform vec3 uColorGold;",
        "varying float vAlpha;",
        "varying vec2 vUv;",
        "varying float vDistortion;",
        "void main(){",
        "  float edge = abs(vUv.y - 0.5) * 2.0;",
        "  float ring = smoothstep(1.0, 0.0, edge);",
        "  ring = pow(ring, 1.5);",
        "  vec3 calmCol = mix(uColorCalm, uColorGold, 0.4);",
        "  vec3 col = mix(calmCol, uColorChaos, uChaos);",
        "  col += vec3(abs(vDistortion) * 0.3) * uChaos;",
        "  float a = vAlpha * ring * (0.55 + 0.45 * (1.0 - uChaos * 0.3));",
        "  if (a < 0.01) discard;",
        "  gl_FragColor = vec4(col, a);",
        "}"
      ].join("\n")
    });

    var N_RINGS = 6;
    for (var i = 0; i < N_RINGS; i++) {
      var torus = new THREE.TorusGeometry(0.6, 0.04, 8, 96);
      var count = torus.attributes.position.count;
      var idx = new Float32Array(count);
      for (var j = 0; j < count; j++) idx[j] = i;
      torus.setAttribute("aRingIndex", new THREE.BufferAttribute(idx, 1));
      var mesh = new THREE.Mesh(torus, ringMat);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    }
    return { group: group, mat: ringMat };
  }

  function buildShieldField(THREE) {
    var group = new THREE.Group();
    var SEGS = 28;
    var R = 1.6;
    var positions = [];
    for (var phi = 0; phi <= SEGS; phi++) {
      for (var theta = 0; theta <= SEGS; theta++) {
        var p = (phi / SEGS) * Math.PI;
        var t = (theta / SEGS) * Math.PI * 2;
        positions.push(
          R * Math.sin(p) * Math.cos(t),
          R * Math.cos(p),
          R * Math.sin(p) * Math.sin(t)
        );
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.0 },
        uColor: { value: new THREE.Color(0xffd770) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        "uniform float uTime;",
        "uniform float uIntensity;",
        "varying float vAlpha;",
        "void main(){",
        "  vec3 p = position;",
        "  float wave = sin(p.x * 3.0 + uTime * 1.5) + sin(p.y * 3.0 + uTime * 1.1);",
        "  p += normalize(p) * wave * 0.04 * uIntensity;",
        "  vAlpha = uIntensity * (0.4 + 0.6 * (sin(uTime * 2.0 + p.x + p.y) * 0.5 + 0.5));",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
        "  gl_PointSize = 2.5 + uIntensity * 1.5;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor;",
        "varying float vAlpha;",
        "void main(){",
        "  vec2 c = gl_PointCoord - 0.5;",
        "  float d = length(c);",
        "  if (d > 0.5) discard;",
        "  float a = (1.0 - d * 2.0) * vAlpha;",
        "  gl_FragColor = vec4(uColor, a * 0.7);",
        "}"
      ].join("\n")
    });
    group.add(new THREE.Points(geo, mat));
    return { group: group, mat: mat };
  }

  /* ============== SCENE FACTORY ============== */
  function makeScene(THREE, mount, opts) {
    opts = opts || {};
    var width = mount.clientWidth || 400;
    var height = mount.clientHeight || 400;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(opts.fov || 38, width / height, 0.1, 100);
    camera.position.set(0, opts.camY || 0.4, opts.camZ || 4.4);
    camera.lookAt(0, 0, 0);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (err) { return null; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, opts.darkBG ? 0x111122 : 0x4a3a1a, 0.85));
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    var fillLight = new THREE.DirectionalLight(0xfff3d4, 0.55);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);
    var rimLight = new THREE.PointLight(0xffd070, 0.9, 12);
    rimLight.position.set(2, -2, 1);
    scene.add(rimLight);

    function resize() {
      var w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);

    return { scene: scene, camera: camera, renderer: renderer, mount: mount, resize: resize };
  }

  function getBlockProgress(block) {
    var rect = block.getBoundingClientRect();
    var blockH = block.offsetHeight;
    var vh = window.innerHeight;
    return clamp(-rect.top / Math.max(1, blockH - vh), 0, 1);
  }

  /* ============== HERO 3D ============== */
  function initHero3D() {
    if (typeof THREE === "undefined") return;
    var stage = document.querySelector("[data-pw-3d-hero]");
    if (!stage) return;
    var mount = stage.querySelector("[data-pw-canvas]");
    if (!mount) return;

    var s = makeScene(THREE, mount, { fov: 35, camZ: 4.4, camY: 0.6 });
    if (!s) return;
    var disc = buildPureWaveDisc(THREE);
    disc.group.rotation.x = -0.45;
    s.scene.add(disc.group);

    var targetRotY = 0.4, targetRotX = -0.45;
    var curRotY = 0.4, curRotX = -0.45;
    var dragging = false;
    var lastX = 0, lastY = 0;
    var followX = 0, followY = 0;
    var startTime = performance.now();

    setTimeout(function () { stage.classList.add("is-3d-loaded"); }, 80);

    function onDown(e) {
      dragging = true;
      stage.classList.add("has-interacted");
      var p = e.touches ? e.touches[0] : e;
      lastX = p.clientX; lastY = p.clientY;
    }
    function onMove(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      targetRotY += (p.clientX - lastX) * 0.01;
      targetRotX += (p.clientY - lastY) * 0.005;
      targetRotX = clamp(targetRotX, -1.4, 1.4);
      lastX = p.clientX; lastY = p.clientY;
      if (e.touches) e.preventDefault();
    }
    function onUp() { dragging = false; }

    s.renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    s.renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    stage.addEventListener("mousemove", function (e) {
      var rect = stage.getBoundingClientRect();
      followX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.25;
      followY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.15;
    });
    stage.addEventListener("mouseleave", function () { followX = 0; followY = 0; });

    var visible = true;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(stage);

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;
      if (!dragging) targetRotY += 0.0035;
      curRotY = lerp(curRotY, targetRotY + followX, 0.12);
      curRotX = lerp(curRotX, targetRotX + followY, 0.12);
      disc.group.rotation.y = curRotY;
      disc.group.rotation.x = curRotX;
      disc.group.position.y = Math.sin(t * 0.9) * 0.06;
      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * SCENE: APPLY — disc flies in and lands on photo backdrop
   * The photo IS the phone. 3D disc enters from upper-right, descends
   * along a curve, and settles to the spot where the disc would be on
   * the phone in the photo.
   * ================================================================= */
  function initSceneApply(block) {
    var mount = block.querySelector("[data-pw-feature-canvas]");
    if (!mount) return;
    var darkBG = block.classList.contains("dark");
    var s = makeScene(THREE, mount, { fov: 36, camZ: 5.0, camY: 0.0, darkBG: darkBG });
    if (!s) return;

    var disc = buildPureWaveDisc(THREE);
    s.scene.add(disc.group);

    // Glowing target ring marker — appears mid-scroll
    var targetRingGeo = new THREE.TorusGeometry(0.6, 0.012, 8, 64);
    var targetRingMat = new THREE.MeshBasicMaterial({ color: 0xffd770, transparent: true, opacity: 0 });
    var targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.rotation.x = Math.PI / 2;
    s.scene.add(targetRing);

    var startTime = performance.now();
    var visible = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(block);

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;

      var p = getBlockProgress(block);

      // Disc trajectory: upper-right → curve down → land at target spot
      // Target = where the disc visually sits on the phone in the photo
      // Photo's disc is roughly center-of-frame, so target ≈ (0, 0.0)
      var startX = 2.6, startY = 1.8, startZ = 0.6;
      var endX = 0.0, endY = -0.1, endZ = 0.0;

      // Quadratic-ish bezier through a control point for arc
      var ctrlX = 1.6, ctrlY = 0.8, ctrlZ = -0.2;
      var ep = easeInOutCubic(p);
      var inv = 1 - ep;
      var dx = inv * inv * startX + 2 * inv * ep * ctrlX + ep * ep * endX;
      var dy = inv * inv * startY + 2 * inv * ep * ctrlY + ep * ep * endY;
      var dz = inv * inv * startZ + 2 * inv * ep * ctrlZ + ep * ep * endZ;
      disc.group.position.set(dx, dy, dz);

      // Disc rotates from edge-on (rotation.x = -PI/2 + small angle) toward face-on (-PI/2)
      // Actually: starts tumbling, ends flat
      disc.group.rotation.x = lerp(-1.4, -Math.PI / 2, easeInOutCubic(p));
      disc.group.rotation.y = lerp(0.5, 0.0, easeInOutCubic(p)) + (1 - p) * t * 0.8;
      disc.group.rotation.z = lerp(0.4, 0.0, easeInOutCubic(p));

      var scale = lerp(0.6, 0.45, p);
      disc.group.scale.setScalar(scale);

      // Target ring fades in around p=0.3..0.6, fades out at p=0.85
      targetRing.material.opacity = (smoothstep(0.3, 0.55, p) - smoothstep(0.78, 0.92, p)) * 0.7;
      targetRing.position.set(0, -0.1, 0);
      targetRing.scale.setScalar(0.5 + Math.sin(t * 2.5) * 0.05);

      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * SCENE: EMF CHAOS → CALM — rings around a phone photo backdrop
   * ================================================================= */
  function initSceneEMF(block) {
    var mount = block.querySelector("[data-pw-feature-canvas]");
    if (!mount) return;
    var darkBG = block.classList.contains("dark");
    var s = makeScene(THREE, mount, { fov: 40, camZ: 5.0, camY: 0.0, darkBG: darkBG });
    if (!s) return;

    var emf = buildEMFWaves(THREE);
    s.scene.add(emf.group);

    // Decorative orbiting disc
    var disc = buildPureWaveDisc(THREE);
    disc.group.scale.setScalar(0.35);
    s.scene.add(disc.group);

    var startTime = performance.now();
    var visible = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(block);

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;
      emf.mat.uniforms.uTime.value = t;

      var p = getBlockProgress(block);
      var chaos = lerp(1.0, 0.0, easeInOutCubic(p));
      emf.mat.uniforms.uChaos.value = chaos;

      // Disc descends from above the frame, then orbits around center
      var discAppear = smoothstep(0.2, 0.6, p);
      disc.group.scale.setScalar(discAppear * 0.4);
      var discY = lerp(2.2, 0.0, easeInOutCubic(p));
      var orbitAngle = (p - 0.5) * Math.PI * 2 + t * 0.3;
      var orbitR = lerp(0.0, 1.4, smoothstep(0.6, 1.0, p));
      var discX = Math.cos(orbitAngle) * orbitR;
      var discZ = Math.sin(orbitAngle) * orbitR * 0.6;
      disc.group.position.set(discX, discY, discZ);
      disc.group.rotation.x = -Math.PI / 2 + Math.sin(t * 0.7) * 0.1;
      disc.group.rotation.z = t * 0.4;

      // EMF wave field tilts and pulses
      emf.group.rotation.y = t * 0.15;
      emf.group.rotation.x = Math.sin(t * 0.3) * 0.08;
      emf.group.scale.setScalar(lerp(1.0, 1.5, smoothstep(0.5, 1.0, p)));

      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * SCENE: SHIELD FIELD — breathing point sphere around a photo
   * ================================================================= */
  function initSceneShield(block) {
    var mount = block.querySelector("[data-pw-feature-canvas]");
    if (!mount) return;
    var darkBG = block.classList.contains("dark");
    var s = makeScene(THREE, mount, { fov: 38, camZ: 5.0, camY: 0.0, darkBG: darkBG });
    if (!s) return;

    var shield = buildShieldField(THREE);
    s.scene.add(shield.group);

    // Decorative center disc that slowly rotates with scroll
    var disc = buildPureWaveDisc(THREE);
    disc.group.scale.setScalar(0.35);
    disc.group.rotation.x = -0.5;
    s.scene.add(disc.group);

    var startTime = performance.now();
    var visible = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(block);

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;
      shield.mat.uniforms.uTime.value = t;

      var p = getBlockProgress(block);

      var intensity = smoothstep(0.05, 0.55, p);
      shield.mat.uniforms.uIntensity.value = intensity;
      shield.group.rotation.y = t * 0.2 + p * Math.PI;
      shield.group.rotation.x = Math.sin(t * 0.25) * 0.12;
      shield.group.scale.setScalar(1.0 + Math.sin(t * 1.2) * 0.04 * intensity);

      // Disc spins more dramatically through this scene
      disc.group.rotation.y = p * Math.PI * 4 + t * 0.5;
      disc.group.rotation.x = -0.5 + Math.sin(t * 0.6) * 0.15;
      disc.group.position.y = Math.sin(t * 1.1) * 0.08;

      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * FLOATING DISC — small decorative 3D disc placed inline mid-page
   * Rotates with scroll, has some idle motion. Used between sections.
   * ================================================================= */
  function initFloatingDiscs() {
    if (typeof THREE === "undefined") return;
    if (prefersReducedMotion) return;
    if (isTinyMobile) return;

    var mounts = document.querySelectorAll("[data-pw-floating]");
    if (!mounts.length) return;

    mounts.forEach(function (mount) {
      var s = makeScene(THREE, mount, { fov: 32, camZ: 4.0, camY: 0.2 });
      if (!s) return;
      var disc = buildPureWaveDisc(THREE);
      var spin = parseFloat(mount.getAttribute("data-spin") || "0.005");
      var tilt = parseFloat(mount.getAttribute("data-tilt") || "-0.3");
      disc.group.rotation.x = tilt;
      s.scene.add(disc.group);

      var startTime = performance.now();
      var visible = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0 }).observe(mount);

      function tick() {
        requestAnimationFrame(tick);
        if (!visible) return;
        var t = (performance.now() - startTime) / 1000;
        disc.holoMat.uniforms.uTime.value = t;
        // Get scroll progress for the disc through its container
        var rect = mount.getBoundingClientRect();
        var vh = window.innerHeight;
        var visP = clamp(1 - (rect.top + rect.height / 2) / vh, 0, 1);
        disc.group.rotation.y = visP * Math.PI * 3 + t * spin * 60;
        disc.group.rotation.x = tilt + Math.sin(t * 0.7) * 0.1;
        disc.group.position.y = Math.sin(t * 0.9) * 0.08;
        s.renderer.render(s.scene, s.camera);
      }
      tick();
    });
  }

  /* =================================================================
   * INIT scenes
   * ================================================================= */
  function initScenes() {
    if (typeof THREE === "undefined") return;
    if (prefersReducedMotion) return;
    if (isTinyMobile) return;

    var blocks = document.querySelectorAll("[data-pw-scene]");
    blocks.forEach(function (block) {
      var scene = block.getAttribute("data-pw-scene");
      if (scene === "apply") initSceneApply(block);
      else if (scene === "emf") initSceneEMF(block);
      else if (scene === "shield") initSceneShield(block);
    });
  }

  /* =================================================================
   * Header scroll behavior — slim down when scrolling
   * ================================================================= */
  function initHeaderScroll() {
    var header = document.querySelector("header");
    if (!header) return;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 60);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ============== INIT ============== */
  function init() {
    initSmoothScroll();
    initScrollProgress();
    initScrollReveal();
    initSplitText();
    initCountdown();
    initBundleSelector();
    initStickyCart();
    initLiveNotif();
    initCounters();
    initParallaxImages();
    initBarFill();
    initMarqueeParallax();
    initScrollTilt();
    initScrollStats();
    initMagneticButtons();
    initHeaderScroll();

    function init3D(attempts) {
      if (typeof THREE !== "undefined") {
        initHero3D();
        initScenes();
        initFloatingDiscs();
      } else if ((attempts || 0) < 100) {
        setTimeout(function () { init3D((attempts || 0) + 1); }, 60);
      }
    }
    init3D();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
