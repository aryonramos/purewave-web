/* =================================================================
 * PUREWAVE — v3 site logic
 * Smooth scroll, multiple 3D scenes, scroll-tied animations,
 * countdown, bundle selector, sticky cart, live notifications.
 * ================================================================= */
(function () {
  "use strict";

  /* ---------- env detection ---------- */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;
  var isMobile = window.innerWidth < 700;

  /* ---------- math helpers ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /* =================================================================
   * SMOOTH SCROLL — minimal Lenis-like inertia. Disabled on touch
   * (native scroll is better on mobile / supports momentum out the box).
   * ================================================================= */
  function initSmoothScroll() {
    if (isTouch || prefersReducedMotion) return;
    // Native smooth scroll behavior is fine; we layer a JS smoothing on top.
    var current = window.scrollY;
    var target = window.scrollY;
    var ease = 0.1;
    var raf = null;

    // We don't take over scroll completely (that would break anchor links,
    // dev tools, etc). Instead we just smooth the values used by our
    // scroll-driven 3D scenes via a custom event.
    function tick() {
      target = window.scrollY;
      current = lerp(current, target, ease);
      if (Math.abs(current - target) > 0.1) {
        window.__pwSmoothY = current;
        raf = requestAnimationFrame(tick);
      } else {
        window.__pwSmoothY = target;
        raf = null;
      }
    }
    window.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    window.__pwSmoothY = window.scrollY;
  }

  /* =================================================================
   * SCROLL PROGRESS BAR (top of page)
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
    window.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* =================================================================
   * SCROLL REVEAL — cards animate in on scroll-into-view
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
      [".rs-item", "reveal-up", 80]
    ];
    tagMap.forEach(function (entry) {
      var sel = entry[0], cls = entry[1], stagger = entry[2];
      document.querySelectorAll(sel).forEach(function (el, i) {
        el.classList.add(cls);
        el.style.transitionDelay = (i * stagger) + "ms";
      });
    });
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal-up, .reveal-left, .reveal-scale")
        .forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll(".reveal-up, .reveal-left, .reveal-scale")
      .forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
   * SPLIT TEXT — split <br>-separated lines, slide each up
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
   * COUNTDOWN — stored in sessionStorage so refresh doesn't reset it
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
   * BUNDLE SELECTOR (with sticky-cart sync)
   * ================================================================= */
  var BUNDLES = {
    "1": { qty: "6×",  label: "Starter Pack",   now: 59,  was: 118 },
    "2": { qty: "12×", label: "Household Pack", now: 89,  was: 178 },
    "3": { qty: "18×", label: "Family Pack",    now: 119, was: 238 }
  };

  function initBundleSelector() {
    var cards = document.querySelectorAll("[data-bundle]");
    var variantInput = document.querySelector("[data-bundle-variant-input]");
    var ctaText = document.querySelector("[data-bundle-cta-text]");
    if (!cards.length) return;

    function select(key) {
      var b = BUNDLES[key];
      if (!b) return;
      cards.forEach(function (card) {
        var active = card.getAttribute("data-bundle") === key;
        card.classList.toggle("active", active);
        card.setAttribute("aria-pressed", active);
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
    select("2");
  }

  /* =================================================================
   * STICKY CART — visible after a bit of scroll
   * ================================================================= */
  function initStickyCart() {
    var bar = document.querySelector("[data-sticky-cart]");
    if (!bar) return;
    function onScroll() { bar.classList.toggle("visible", window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* =================================================================
   * LIVE NOTIFICATIONS — fake purchase toasts
   * ================================================================= */
  var purchases = [
    { name: "Sarah",   city: "Austin, TX",    product: "Household Pack", time: "12 min ago" },
    { name: "Michael", city: "Chicago, IL",   product: "Family Pack",    time: "8 min ago"  },
    { name: "Emma",    city: "Denver, CO",    product: "Starter Pack",   time: "5 min ago"  },
    { name: "Jake",    city: "Seattle, WA",   product: "Household Pack", time: "3 min ago"  },
    { name: "Lauren",  city: "Phoenix, AZ",   product: "Family Pack",    time: "1 min ago"  },
    { name: "Ryan",    city: "Nashville, TN", product: "Household Pack", time: "just now"   },
    { name: "Olivia",  city: "Portland, OR",  product: "Starter Pack",   time: "4 min ago"  },
    { name: "Marcus",  city: "San Diego, CA", product: "Family Pack",    time: "7 min ago"  }
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
    setTimeout(function () { show(); setInterval(show, 14000); }, 7000);
  }

  /* =================================================================
   * NUMBER COUNTERS — animate 0 → target on enter view
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
        if (decimals > 0) {
          display = v.toFixed(decimals);
        } else if (hasComma) {
          display = Math.floor(v).toLocaleString();
        } else {
          display = Math.floor(v);
        }
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
   * PARALLAX IMAGES — light scroll-driven y-translation
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
      items.push({ wrap: wrap, img: img });
    });

    var raf = null;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var rect = it.wrap.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var center = rect.top + rect.height / 2;
        var p = (center - vh / 2) / vh;
        var y = clamp(p * -28, -50, 50);
        it.img.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) scale(1.1)";
      });
      raf = null;
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  /* =================================================================
   * BAR FILL — animate `--bar-fill` CSS var when in-view
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
   *           THREE.JS — BUILD THE PUREWAVE DISC
   * ================================================================= */
  function buildPureWaveDisc(THREE, opts) {
    opts = opts || {};
    var disc = new THREE.Group();
    disc.name = "PureWaveDisc";

    var radius = 1.0;
    var thickness = 0.085;

    // Holographic shader for the curved face
    var holoMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0xf6c942) }, // warm gold
        uColorB: { value: new THREE.Color(0xb6e25b) }, // green-yellow
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

    // Black inner faces — top/bottom
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

    // Cardano-style constellation
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

    // Gold rim ring
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

  /* =================================================================
   * GENERIC 3D SCENE BUILDER (used by hero + features + floating discs)
   * Returns { scene, camera, renderer, disc, holoMat, dispose, setVisible }
   * ================================================================= */
  function makeDiscScene(THREE, mount, opts) {
    opts = opts || {};
    var width = mount.clientWidth || 400;
    var height = mount.clientHeight || 400;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(opts.fov || 38, width / height, 0.1, 100);
    camera.position.set(0, opts.camY || 0.4, opts.camZ || 4.4);
    camera.lookAt(0, 0, 0);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (err) { return null; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    mount.appendChild(renderer.domElement);

    // Lighting
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

    var disc = buildPureWaveDisc(THREE);
    disc.rotation.x = opts.startRotX || -0.45;
    disc.rotation.y = opts.startRotY || 0;
    scene.add(disc);

    var holoMat = null;
    disc.traverse(function (o) {
      if (o.material && o.material.uniforms && o.material.uniforms.uTime) holoMat = o.material;
    });

    function resize() {
      var w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);

    function dispose() {
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    return { scene: scene, camera: camera, renderer: renderer, disc: disc, holoMat: holoMat, mount: mount, resize: resize, dispose: dispose };
  }

  /* =================================================================
   * HERO 3D — drag, mouse-follow, idle spin, gentle float
   * ================================================================= */
  function initHero3D() {
    if (typeof THREE === "undefined") return;
    var stage = document.querySelector("[data-pw-3d-hero]");
    if (!stage) return;
    var mount = stage.querySelector("[data-pw-canvas]");
    if (!mount) return;

    var s = makeDiscScene(THREE, mount, { fov: 35, camZ: 4.4, camY: 0.6 });
    if (!s) return;

    var targetRotY = 0.4, targetRotX = -0.45;
    var curRotY = 0.4, curRotX = -0.45;
    var dragging = false;
    var lastX = 0, lastY = 0;
    var idleSpinSpeed = 0.0035;
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
      followX = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.25;
      followY = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.15;
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
      if (s.holoMat) s.holoMat.uniforms.uTime.value = t;

      if (!dragging) targetRotY += idleSpinSpeed;
      curRotY = lerp(curRotY, targetRotY + followX, 0.12);
      curRotX = lerp(curRotX, targetRotX + followY, 0.12);

      s.disc.rotation.y = curRotY;
      s.disc.rotation.x = curRotX;
      s.disc.position.y = Math.sin(t * 0.9) * 0.06;

      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * FEATURE PIN 3D SCENES — three sticky-pinned scenes whose disc
   * state (rotation, scale, position) is tied to scroll progress
   * through the parent .feature-block.
   *
   * Each .feature-block has a [data-pw-feature="N"] attribute (0-2)
   * that we use to pick distinct keyframes per scene.
   * ================================================================= */
  function initFeaturePins() {
    if (typeof THREE === "undefined") return;
    if (prefersReducedMotion) return;

    var blocks = document.querySelectorAll("[data-pw-feature]");
    if (!blocks.length) return;

    // Disable on very small mobile (battery/perf)
    if (isMobile && window.innerWidth < 500) return;

    // Different keyframe paths per feature index
    var keyframeSets = {
      "0": [
        // "Engineered" — face on, rotates side-on, reveals depth
        { p: 0.00, rotX: -0.5, rotY: 0.0,  posY: 0.0,  scale: 1.0  },
        { p: 0.50, rotX: -0.9, rotY: 1.2,  posY: 0.05, scale: 1.05 },
        { p: 1.00, rotX: -1.5, rotY: 2.0,  posY: 0.0,  scale: 0.9  }
      ],
      "1": [
        // "Applied" — peel/press feel: tilt forward, drop, settle
        { p: 0.00, rotX: -1.4, rotY: 0.5,  posY: 0.4,  scale: 1.05 },
        { p: 0.50, rotX: -1.0, rotY: 1.5,  posY: 0.0,  scale: 1.0  },
        { p: 1.00, rotX: -0.4, rotY: 3.0,  posY: -0.05,scale: 0.95 }
      ],
      "2": [
        // "Invisible" — multiple full rotations + zoom, then shrink
        { p: 0.00, rotX: -0.3, rotY: 0.0,  posY: 0.0,  scale: 1.0  },
        { p: 0.50, rotX: -0.6, rotY: 3.14, posY: 0.0,  scale: 1.1  },
        { p: 1.00, rotX: -0.8, rotY: 6.28, posY: 0.0,  scale: 0.7  }
      ]
    };

    function interp(keyframes, p) {
      for (var i = 0; i < keyframes.length - 1; i++) {
        var a = keyframes[i], b = keyframes[i + 1];
        if (p >= a.p && p <= b.p) {
          var t = (p - a.p) / (b.p - a.p);
          t = easeInOutCubic(t);
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

    blocks.forEach(function (block) {
      var idx = block.getAttribute("data-pw-feature") || "0";
      var keyframes = keyframeSets[idx] || keyframeSets["0"];
      var mount = block.querySelector("[data-pw-feature-canvas]");
      if (!mount) return;

      var darkBG = block.classList.contains("dark");
      var s = makeDiscScene(THREE, mount, { fov: 38, camZ: 4.0, camY: 0.0, darkBG: darkBG });
      if (!s) return;

      // Slight starting tilt
      s.disc.rotation.x = keyframes[0].rotX;

      var startTime = performance.now();
      var visible = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0 }).observe(block);

      function tick() {
        requestAnimationFrame(tick);
        if (!visible) return;

        var t = (performance.now() - startTime) / 1000;
        if (s.holoMat) s.holoMat.uniforms.uTime.value = t;

        var rect = block.getBoundingClientRect();
        var blockH = block.offsetHeight;
        var vh = window.innerHeight;
        // Scroll progress through this block. 0 = block top hits viewport top,
        // 1 = block bottom hits viewport bottom.
        var progress = clamp(-rect.top / Math.max(1, blockH - vh), 0, 1);

        var k = interp(keyframes, progress);
        s.disc.rotation.x = k.rotX + Math.sin(t * 0.4) * 0.03;
        s.disc.rotation.y = k.rotY;
        s.disc.position.y = k.posY;
        s.disc.scale.setScalar(k.scale);

        s.renderer.render(s.scene, s.camera);
      }
      tick();
    });
  }

  /* =================================================================
   * FLOATING DISCS — small decorative discs sprinkled between sections
   * Each spins idly + has a tiny scroll-tied rotation for life.
   * ================================================================= */
  function initFloatingDiscs() {
    if (typeof THREE === "undefined") return;
    if (prefersReducedMotion) return;
    if (isMobile && window.innerWidth < 500) return;

    var mounts = document.querySelectorAll("[data-pw-floating]");
    if (!mounts.length) return;

    mounts.forEach(function (mount) {
      var s = makeDiscScene(THREE, mount, { fov: 32, camZ: 4.0, camY: 0.2 });
      if (!s) return;

      var spin = parseFloat(mount.getAttribute("data-spin") || "0.005");
      var tilt = parseFloat(mount.getAttribute("data-tilt") || "-0.3");
      s.disc.rotation.x = tilt;

      var startTime = performance.now();
      var visible = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0 }).observe(mount);

      function tick() {
        requestAnimationFrame(tick);
        if (!visible) return;
        var t = (performance.now() - startTime) / 1000;
        if (s.holoMat) s.holoMat.uniforms.uTime.value = t;
        s.disc.rotation.y += spin;
        s.disc.position.y = Math.sin(t * 0.7) * 0.08;
        s.renderer.render(s.scene, s.camera);
      }
      tick();
    });
  }

  /* =================================================================
   * INIT
   * ================================================================= */
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

    // 3D scenes load once Three.js is ready
    function init3D(attempts) {
      if (typeof THREE !== "undefined") {
        initHero3D();
        initFeaturePins();
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
