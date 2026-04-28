(function () {
  "use strict";

  /* ================================================================
   * UTILITIES
   * ================================================================ */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;
  var isSmallScreen = window.innerWidth < 700;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ================================================================
   * SCROLL REVEAL  (preserved from original)
   * ================================================================ */
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
    ];
    tagMap.forEach(function (entry) {
      var selector = entry[0], className = entry[1], stagger = entry[2];
      document.querySelectorAll(selector).forEach(function (el, i) {
        el.classList.add(className);
        el.style.transitionDelay = (i * stagger) + "ms";
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
    }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll(".reveal-up, .reveal-left, .reveal-scale").forEach(function (el) { io.observe(el); });
  }

  /* ================================================================
   * COUNTDOWN  (preserved)
   * ================================================================ */
  function initCountdown() {
    var bar = document.querySelector("[data-countdown]");
    if (!bar) return;
    var hEl = bar.querySelector("[data-cd-h]");
    var mEl = bar.querySelector("[data-cd-m]");
    var sEl = bar.querySelector("[data-cd-s]");
    var endKey = "pw_offer_end_v5";
    var OFFER_DURATION_MS = (23 * 3600 + 47 * 60 + 12) * 1000;
    var end = 0;
    try { end = parseInt(sessionStorage.getItem(endKey) || "0", 10); } catch (e) {}
    if (!end || end < Date.now()) {
      end = Date.now() + OFFER_DURATION_MS;
      try { sessionStorage.setItem(endKey, String(end)); } catch (e) {}
    }
    function pad(n) { return String(n).padStart(2, "0"); }
    function tick() {
      var diff = Math.max(0, end - Date.now());
      if (diff === 0 && bar) { bar.style.display = "none"; return; }
      var hh = Math.floor(diff / 3600000);
      var mm = Math.floor((diff % 3600000) / 60000);
      var ss = Math.floor((diff % 60000) / 1000);
      if (hEl) hEl.textContent = pad(hh);
      if (mEl) mEl.textContent = pad(mm);
      if (sEl) sEl.textContent = pad(ss);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ================================================================
   * BUNDLE SELECTOR  (preserved)
   * ================================================================ */
  var BUNDLES = {
    "1": { qty: "6×",  label: "Starter Pack",   now: 59,  was: 118 },
    "2": { qty: "12×", label: "Household Pack", now: 89,  was: 178 },
    "3": { qty: "18×", label: "Family Pack",    now: 119, was: 238 }
  };
  var selectedBundle = "2";

  function initBundleSelector() {
    var cards = document.querySelectorAll("[data-bundle]");
    var variantInput = document.querySelector("[data-bundle-variant-input]");
    var ctaText = document.querySelector("[data-bundle-cta-text]");
    if (!cards.length) return;

    function select(key) {
      selectedBundle = key;
      var b = BUNDLES[key];
      cards.forEach(function (card) {
        var isActive = card.getAttribute("data-bundle") === key;
        card.classList.toggle("active", isActive);
        card.setAttribute("aria-pressed", isActive);
      });
      if (variantInput) {
        variantInput.value = variantInput.getAttribute("data-variant-" + key) || variantInput.value;
      }
      if (ctaText) ctaText.textContent = "Add To Cart \u00B7 $" + b.now.toFixed(2) + " USD";

      var sLabel = document.querySelector("[data-sticky-label]");
      var sWas   = document.querySelector("[data-sticky-was]");
      var sNow   = document.querySelector("[data-sticky-now]");
      var sBtnL  = document.querySelector("[data-sticky-btn-long]");
      var sBtnS  = document.querySelector("[data-sticky-btn-short]");
      if (sLabel) sLabel.textContent = "PureWave " + b.label;
      if (sWas)   sWas.textContent  = "$" + b.was;
      if (sNow)   sNow.textContent  = "$" + b.now + " USD";
      if (sBtnL)  sBtnL.textContent = "Add to Cart \u00B7 $" + b.now;
      if (sBtnS)  sBtnS.textContent = "Buy $" + b.now;
    }

    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var key = card.getAttribute("data-bundle");
        if (key) select(key);
      });
    });
    select(selectedBundle);
  }

  /* ================================================================
   * STICKY CART  (preserved)
   * ================================================================ */
  function initStickyCart() {
    var bar = document.querySelector("[data-sticky-cart]");
    if (!bar) return;
    function onScroll() { bar.classList.toggle("visible", window.scrollY > 520); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ================================================================
   * LIVE NOTIFICATIONS  (preserved)
   * ================================================================ */
  var purchases = [
    { name: "Sarah",   city: "Austin, TX",    product: "Household Pack", time: "12 minutes ago" },
    { name: "Michael", city: "Chicago, IL",   product: "Family Pack",    time: "8 minutes ago"  },
    { name: "Emma",    city: "Denver, CO",    product: "Starter Pack",   time: "5 minutes ago"  },
    { name: "Jake",    city: "Seattle, WA",   product: "Household Pack", time: "3 minutes ago"  },
    { name: "Lauren",  city: "Phoenix, AZ",   product: "Family Pack",    time: "1 minute ago"   },
    { name: "Ryan",    city: "Nashville, TN", product: "Household Pack", time: "just now"       },
    { name: "Olivia",  city: "Portland, OR",  product: "Starter Pack",   time: "4 minutes ago"  },
    { name: "Marcus",  city: "San Diego, CA", product: "Family Pack",    time: "7 minutes ago"  }
  ];

  function initLiveNotif() {
    var notif = document.querySelector("[data-live-notif]");
    if (!notif) return;
    var avatar = notif.querySelector("[data-live-avatar]");
    var text   = notif.querySelector("[data-live-text]");
    var idx = 0;

    function show() {
      var p = purchases[idx % purchases.length];
      if (avatar) avatar.textContent = p.name[0];
      if (text) text.innerHTML =
        "<b>" + p.name + " from " + p.city + "</b><br>" +
        "<span style=\"color:#6a6b72\">ordered the " + p.product + "</span><br>" +
        "<span style=\"color:#9a9ba0;font-size:11px\">" + p.time + "</span>";
      notif.classList.add("show");
      setTimeout(function () { notif.classList.remove("show"); }, 4500);
      idx++;
    }
    setTimeout(function () { show(); setInterval(show, 12000); }, 6000);
  }

  /* ================================================================
   * DISCLAIMER STYLES  (preserved)
   * ================================================================ */
  function addDisclaimerStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ".offer-disclaimer{margin-top:20px;font-size:11px;color:var(--muted);line-height:1.7;text-align:center;max-width:680px;margin-inline:auto;padding:0 16px;}",
      ".footer-disclaimer-full{font-size:11px;color:var(--muted);line-height:1.8;text-align:center;padding:20px 0 12px;border-top:1px solid var(--border);margin-top:32px;max-width:700px;margin-inline:auto;}"
    ].join("");
    document.head.appendChild(style);
  }

  /* ================================================================
   * NEW: CUSTOM CURSOR (desktop only)
   * ================================================================ */
  function initCustomCursor() {
    if (isTouch || prefersReducedMotion) return;
    var cursor = document.querySelector("[data-pw-cursor]");
    if (!cursor) return;

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var tx = x, ty = y;

    document.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });

    var hoverSel = "a, button, summary, [data-tilt], [data-magnetic], input, label";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) cursor.classList.add("hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) cursor.classList.remove("hover");
    });

    function tick() {
      x = lerp(x, tx, 0.22);
      y = lerp(y, ty, 0.22);
      cursor.style.transform = "translate(" + x + "px, " + y + "px)";
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ================================================================
   * NEW: SPLIT TEXT REVEAL
   * Headlines split into lines (by <br>), each line wrapped in
   * overflow:hidden, then slid up from a mask on scroll-into-view.
   * ================================================================ */
  function initSplitText() {
    if (prefersReducedMotion) return;
    var els = document.querySelectorAll("[data-split-text]");
    if (!els.length) return;

    els.forEach(function (el) {
      var html = el.innerHTML;
      var parts = html.split(/<br\s*\/?>/i);
      var wrapped = parts.map(function (line) {
        return '<span class="pw-split-line"><span class="pw-split-line-inner">' + line.trim() + '</span></span>';
      }).join("");
      el.innerHTML = wrapped;
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
    }, { threshold: 0.25, rootMargin: "0px 0px -10% 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ================================================================
   * NEW: 3D TILT ON CARDS
   * ================================================================ */
  function initTilt() {
    if (isTouch || prefersReducedMotion) return;
    var els = document.querySelectorAll("[data-tilt]");
    if (!els.length) return;

    els.forEach(function (el) {
      var rect = null, rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
      var maxTilt = 8;

      function update() {
        rx = lerp(rx, tx, 0.18);
        ry = lerp(ry, ty, 0.18);
        el.style.transform =
          "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        if (Math.abs(rx - tx) > 0.05 || Math.abs(ry - ty) > 0.05) {
          raf = requestAnimationFrame(update);
        } else {
          raf = null;
        }
      }

      el.addEventListener("mouseenter", function () {
        rect = el.getBoundingClientRect();
        el.classList.add("is-tilting");
      });
      el.addEventListener("mousemove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top)  / rect.height;
        ty =  (px - 0.5) * 2 * maxTilt;
        tx = -(py - 0.5) * 2 * maxTilt;
        el.style.setProperty("--tilt-x", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--tilt-y", (py * 100).toFixed(1) + "%");
        if (!raf) raf = requestAnimationFrame(update);
      });
      el.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        el.classList.remove("is-tilting");
        if (!raf) raf = requestAnimationFrame(update);
      });
    });
  }

  /* ================================================================
   * NEW: MAGNETIC BUTTONS
   * ================================================================ */
  function initMagnetic() {
    if (isTouch || prefersReducedMotion) return;
    var els = document.querySelectorAll("[data-magnetic]");
    if (!els.length) return;

    els.forEach(function (el) {
      var strength = 0.3;
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top  + rect.height / 2);
        el.style.transform = "translate(" + (dx * strength).toFixed(1) + "px, " + (dy * strength).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = "translate(0, 0)"; });
    });
  }

  /* ================================================================
   * NEW: NUMBER COUNTERS
   * ================================================================ */
  function initCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (!els.length || !("IntersectionObserver" in window)) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var suffix = el.getAttribute("data-suffix") || "";
      var hasComma = target >= 1000;
      var duration = 1600;
      var start = performance.now();

      function step(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        var val = target * eased;
        var display = hasComma ? Math.floor(val).toLocaleString() : Math.floor(val);
        el.textContent = display + suffix;
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

  /* ================================================================
   * NEW: PARALLAX IMAGES (scroll-driven gentle float)
   * ================================================================ */
  function initParallaxImages() {
    if (prefersReducedMotion) return;
    var wraps = document.querySelectorAll("[data-parallax-image]");
    if (!wraps.length) return;

    var items = [];
    wraps.forEach(function (wrap) {
      var img = wrap.querySelector("img");
      if (!img) return;
      img.style.transform = "translate3d(0,0,0) scale(1.12)";
      items.push({ wrap: wrap, img: img });
    });

    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var rect = it.wrap.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var center = rect.top + rect.height / 2;
        var p = (center - vh / 2) / vh;
        var translate = clamp(p * -30, -50, 50);
        it.img.style.transform = "translate3d(0," + translate.toFixed(1) + "px,0) scale(1.12)";
      });
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ================================================================
   * NEW: BUILD THE PUREWAVE 3D DISC (procedural Three.js mesh)
   *
   * Modeled after the actual product photos:
   *   - Slim cylindrical body with gold holographic shader on the curved face
   *   - Black inner disc with the 25-dot constellation pattern
   *   - Polished gold rim ring
   * ================================================================ */
  function buildPureWaveDisc(THREE) {
    var disc = new THREE.Group();
    disc.name = "PureWaveDisc";

    var radius = 1.0;
    var thickness = 0.085;

    // Holographic shader for the body
    var holoMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0xf6c942) }, // warm gold
        uColorB: { value: new THREE.Color(0xb6e25b) }, // green-yellow accent
        uColorC: { value: new THREE.Color(0xffe89a) }, // bright highlight
        uColorD: { value: new THREE.Color(0xb8872c) }  // deep gold
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
        "uniform vec3 uColorA;",
        "uniform vec3 uColorB;",
        "uniform vec3 uColorC;",
        "uniform vec3 uColorD;",
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
    var body = new THREE.Mesh(bodyGeo, holoMat);
    disc.add(body);

    // Black inner faces (top + bottom) with the constellation
    var innerRadius = 0.62;
    var innerGeo = new THREE.CircleGeometry(innerRadius, 96);
    var innerMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0e,
      roughness: 0.55,
      metalness: 0.2
    });

    var innerTop = new THREE.Mesh(innerGeo, innerMat);
    innerTop.rotation.x = -Math.PI / 2;
    innerTop.position.y = thickness / 2 + 0.001;
    disc.add(innerTop);

    var innerBot = new THREE.Mesh(innerGeo, innerMat);
    innerBot.rotation.x = Math.PI / 2;
    innerBot.position.y = -thickness / 2 - 0.001;
    disc.add(innerBot);

    // Constellation: 1 center + 8 spokes × 3 dots
    var dotMat = new THREE.MeshBasicMaterial({ color: 0xf3c956 });
    var bigDot = new THREE.CircleGeometry(0.06, 32);
    var midDot = new THREE.CircleGeometry(0.045, 24);
    var smDot  = new THREE.CircleGeometry(0.03, 24);

    function addDot(geo, x, z, faceY) {
      var m = new THREE.Mesh(geo, dotMat);
      m.rotation.x = -Math.PI / 2 * Math.sign(faceY);
      m.position.set(x, faceY, z);
      disc.add(m);
    }

    function constellation(faceY) {
      var s = Math.sign(faceY);
      addDot(bigDot, 0, 0, faceY);
      var spokes = 8;
      for (var i = 0; i < spokes; i++) {
        var ang = (i / spokes) * Math.PI * 2;
        var cx = Math.cos(ang), cz = Math.sin(ang);
        addDot(midDot, cx * 0.18 * s, cz * 0.18, faceY);
        addDot(midDot, cx * 0.32 * s, cz * 0.32, faceY);
        addDot(smDot,  cx * 0.46 * s, cz * 0.46, faceY);
      }
    }
    constellation(thickness / 2 + 0.0025);
    constellation(-thickness / 2 - 0.0025);

    // Gold rim ring (top + bottom edge)
    var rimGeo = new THREE.TorusGeometry(radius - 0.005, 0.012, 12, 96);
    var rimMat = new THREE.MeshStandardMaterial({
      color: 0xffe18a,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0x6a4a10,
      emissiveIntensity: 0.4
    });
    var rimTop = new THREE.Mesh(rimGeo, rimMat);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.y = thickness / 2;
    disc.add(rimTop);

    var rimBot = new THREE.Mesh(rimGeo, rimMat);
    rimBot.rotation.x = Math.PI / 2;
    rimBot.position.y = -thickness / 2;
    disc.add(rimBot);

    return disc;
  }

  /* ================================================================
   * NEW: HERO 3D SCENE
   * Auto-spins + drag-to-rotate + subtle mouse parallax.
   * ================================================================ */
  function initHero3D() {
    if (typeof THREE === "undefined") return;
    var stage = document.querySelector("[data-pw-3d-hero]");
    if (!stage) return;
    var mount = stage.querySelector("[data-pw-canvas]");
    if (!mount) return;

    var width  = mount.clientWidth || 500;
    var height = mount.clientHeight || 500;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 4.4);
    camera.lookAt(0, 0, 0);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (err) {
      // WebGL unavailable — leave the fallback image visible
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a3a1a, 0.85));

    var keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    var fillLight = new THREE.DirectionalLight(0xfff3d4, 0.6);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    var rimLight = new THREE.PointLight(0xffd070, 0.9, 12);
    rimLight.position.set(2, -2, 1);
    scene.add(rimLight);

    // The disc
    var disc = buildPureWaveDisc(THREE);
    disc.rotation.x = -0.45;
    scene.add(disc);

    var holoMat = null;
    disc.traverse(function (o) {
      if (o.material && o.material.uniforms && o.material.uniforms.uTime) holoMat = o.material;
    });

    // Interaction state
    var targetRotY = 0.4, targetRotX = -0.45;
    var curRotY = 0.4, curRotX = -0.45;
    var dragging = false;
    var lastX = 0, lastY = 0;
    var idleSpinSpeed = 0.0035;
    var mouseFollowX = 0, mouseFollowY = 0;
    var startTime = performance.now();

    setTimeout(function () { stage.classList.add("is-3d-loaded"); }, 100);

    // Drag (mouse + touch)
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

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    // Subtle mouse-follow when not dragging
    stage.addEventListener("mousemove", function (e) {
      var rect = stage.getBoundingClientRect();
      mouseFollowX = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.25;
      mouseFollowY = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.15;
    });
    stage.addEventListener("mouseleave", function () { mouseFollowX = 0; mouseFollowY = 0; });

    // Resize
    window.addEventListener("resize", function () {
      var w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });

    // Pause off-screen
    var visible = true;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(stage);

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      if (holoMat) holoMat.uniforms.uTime.value = t;

      if (!dragging) targetRotY += idleSpinSpeed;

      curRotY = lerp(curRotY, targetRotY + mouseFollowX, 0.12);
      curRotX = lerp(curRotX, targetRotX + mouseFollowY, 0.12);

      disc.rotation.y = curRotY;
      disc.rotation.x = curRotX;
      disc.position.y = Math.sin(t * 0.9) * 0.06; // gentle float

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ================================================================
   * NEW: STICKY 3D SCROLL STORY
   * Disc pinned in viewport; rotates and scales as user scrolls past
   * three text panels.
   * ================================================================ */
  function initSticky3D() {
    if (typeof THREE === "undefined") return;
    if (prefersReducedMotion) return;
    var section = document.querySelector("[data-pw-sticky3d]");
    if (!section) return;
    var mount = section.querySelector("[data-pw-sticky-canvas]");
    if (!mount) return;
    var panels = section.querySelectorAll(".sticky-3d-panel");
    var dots   = section.querySelectorAll(".s3d-dot");

    var width  = mount.clientWidth  || window.innerWidth;
    var height = mount.clientHeight || window.innerHeight;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (err) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5a30, 0.95));
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);
    var rimLight = new THREE.PointLight(0xffd070, 0.7, 12);
    rimLight.position.set(-3, -1, 2);
    scene.add(rimLight);

    var disc = buildPureWaveDisc(THREE);
    disc.rotation.x = -0.5;
    scene.add(disc);

    var holoMat = null;
    disc.traverse(function (o) {
      if (o.material && o.material.uniforms && o.material.uniforms.uTime) holoMat = o.material;
    });

    window.addEventListener("resize", function () {
      var w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });

    var visible = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(section);

    // Three keyframe states across scroll progress 0..1
    var keyframes = [
      { p: 0.00, rotX: -0.5, rotY: 0.0,  posY: 0.0,  scale: 1.0  },
      { p: 0.50, rotX: -1.1, rotY: 1.4,  posY: 0.05, scale: 1.05 },
      { p: 1.00, rotX: -0.2, rotY: 3.2,  posY: 0.0,  scale: 0.85 }
    ];

    function interp(p) {
      for (var i = 0; i < keyframes.length - 1; i++) {
        var a = keyframes[i], b = keyframes[i + 1];
        if (p >= a.p && p <= b.p) {
          var t = (p - a.p) / (b.p - a.p);
          t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          return {
            rotX: lerp(a.rotX, b.rotX, t),
            rotY: lerp(a.rotY, b.rotY, t),
            posY: lerp(a.posY, b.posY, t),
            scale: lerp(a.scale, b.scale, t)
          };
        }
      }
      return keyframes[keyframes.length - 1];
    }

    var startTime = performance.now();
    var currentPanel = -1;

    function setActivePanel(idx) {
      if (idx === currentPanel) return;
      currentPanel = idx;
      panels.forEach(function (p, i) { p.classList.toggle("is-active", i === idx); });
      dots.forEach(function (d, i)   { d.classList.toggle("is-active", i === idx); });
    }

    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;

      var t = (performance.now() - startTime) / 1000;
      if (holoMat) holoMat.uniforms.uTime.value = t;

      var rect = section.getBoundingClientRect();
      var sectionH = section.offsetHeight;
      var vh = window.innerHeight;
      var progress = clamp(-rect.top / (sectionH - vh), 0, 1);

      var k = interp(progress);
      disc.rotation.x = k.rotX + Math.sin(t * 0.5) * 0.04;
      disc.rotation.y = k.rotY;
      disc.position.y = k.posY;
      disc.scale.setScalar(k.scale);

      var pi = progress < 0.34 ? 0 : (progress < 0.67 ? 1 : 2);
      setActivePanel(pi);

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ================================================================
   * INIT
   * ================================================================ */
  function init() {
    addDisclaimerStyles();
    initScrollReveal();
    initCountdown();
    initBundleSelector();
    initStickyCart();
    initLiveNotif();

    initSplitText();
    initCustomCursor();
    initTilt();
    initMagnetic();
    initCounters();
    initParallaxImages();

    // 3D scenes — wait for Three.js (it's deferred from CDN)
    function init3DWhenReady(attempts) {
      if (typeof THREE !== "undefined") {
        initHero3D();
        if (!isSmallScreen) initSticky3D();
      } else if ((attempts || 0) < 100) {
        setTimeout(function () { init3DWhenReady((attempts || 0) + 1); }, 60);
      }
    }
    init3DWhenReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
