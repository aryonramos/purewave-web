/* =================================================================
 * PUREWAVE — v6 site logic
 *
 * Philosophy: every section is a small interactive demo or 3D moment,
 * not a wall of copy. The page reads as a series of toys.
 * ================================================================= */
(function () {
  "use strict";

  /* ---------- env ---------- */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;
  var isMobile = window.innerWidth < 700;
  var DPR_CAP = isMobile ? 1.5 : 2.0;

  /* ---------- helpers ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function smoothstep(a, b, t) { var x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function blockProgress(block) {
    var rect = block.getBoundingClientRect();
    var blockH = block.offsetHeight;
    var vh = window.innerHeight;
    return clamp(-rect.top / Math.max(1, blockH - vh), 0, 1);
  }
  function inView(block, threshold) {
    threshold = threshold || 0;
    var rect = block.getBoundingClientRect();
    var vh = window.innerHeight;
    return rect.bottom > threshold && rect.top < vh - threshold;
  }

  /* =================================================================
   * GLOBAL — scroll progress bar, smooth scroll value publisher
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
   * SCROLL REVEAL
   * ================================================================= */
  function initScrollReveal() {
    var sels = [
      [".reveal", 80],
      [".sticker", 90],
      [".bundle", 80],
      [".faq-item", 60],
      [".review-card", 80],
      [".og-item", 60]
    ];
    sels.forEach(function (s) {
      document.querySelectorAll(s[0]).forEach(function (el, i) {
        el.classList.add("rv");
        el.style.transitionDelay = (i * s[1]) + "ms";
      });
    });
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("on"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });
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
   * COUNTERS
   * ================================================================= */
  function initCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var duration = 1700;
      var start = performance.now();
      function step(now) {
        var t = Math.min(1, (now - start) / duration);
        var v = target * easeOutCubic(t);
        var display;
        if (decimals > 0) display = v.toFixed(decimals);
        else if (target >= 1000) display = Math.floor(v).toLocaleString();
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
    var ctaText = document.querySelector("[data-bundle-cta-text]");
    if (!cards.length) return;
    function select(key) {
      var b = BUNDLES[key]; if (!b) return;
      cards.forEach(function (card) {
        var active = card.getAttribute("data-bundle") === key;
        card.classList.toggle("active", active);
        card.setAttribute("aria-pressed", active);
      });
      if (ctaText) ctaText.textContent = "Add To Cart \u00B7 $" + b.now.toFixed(2);
      var sLabel = document.querySelector("[data-sticky-label]");
      var sNow = document.querySelector("[data-sticky-now]");
      var sBtn = document.querySelector("[data-sticky-btn]");
      if (sLabel) sLabel.textContent = "PureWave " + b.label;
      if (sNow) sNow.textContent = "$" + b.now;
      if (sBtn) sBtn.textContent = "Buy $" + b.now;
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
    function onScroll() { bar.classList.toggle("visible", window.scrollY > 800); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* =================================================================
   * MAGNETIC BUTTONS
   * ================================================================= */
  function initMagnetic() {
    if (prefersReducedMotion || isTouch) return;
    var els = document.querySelectorAll("[data-magnetic]");
    els.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
        el.style.transform = "translate(" + dx + "px, " + dy + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = "translate(0,0)"; });
    });
  }

  /* =================================================================
   * MARQUEE PARALLAX
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
        var p = 1 - rect.top / vh;
        m.style.setProperty("--marquee-offset", (p * -80).toFixed(0) + "px");
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * STICKER PARALLAX — each .sticker drifts at its own speed
   * ================================================================= */
  function initStickerParallax() {
    if (prefersReducedMotion || isMobile) return;
    var stickers = document.querySelectorAll("[data-sticker-speed]");
    if (!stickers.length) return;
    var items = [];
    stickers.forEach(function (el) {
      items.push({ el: el, speed: parseFloat(el.getAttribute("data-sticker-speed") || "0.2") });
    });
    var raf = null;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var rect = it.el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var center = rect.top + rect.height / 2;
        var p = (center - vh / 2) / vh;
        var y = clamp(p * -it.speed * 60, -80, 80);
        var rot = parseFloat(it.el.getAttribute("data-sticker-rotate") || "0");
        it.el.style.transform = "translateY(" + y.toFixed(1) + "px) rotate(" + rot + "deg)";
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * THREE.JS BUILDERS — reused
   * ================================================================= */

  /**
   * The PureWave disc: gold rim, holographic shader on curved face,
   * dark inner faces, gold dot constellation.
   */
  function buildDisc(THREE) {
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

  /**
   * EMF wave rings — chaotic when uChaos=1, calm when uChaos=0.
   */
  function buildEMF(THREE) {
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

  /* =================================================================
   * SCENE: HERO — big disc, drag to rotate, idle spin
   * ================================================================= */
  function initHero3D() {
    if (typeof THREE === "undefined") return;
    var mount = document.querySelector("[data-pw-hero]");
    if (!mount) return;
    var s = makeScene(THREE, mount, { fov: 32, camZ: 4.6, camY: 0.4 });
    if (!s) return;
    var disc = buildDisc(THREE);
    disc.group.rotation.x = -0.45;
    s.scene.add(disc.group);
    var targetRotY = 0.4, targetRotX = -0.45;
    var curRotY = 0.4, curRotX = -0.45;
    var dragging = false, lastX = 0, lastY = 0;
    var followX = 0, followY = 0;
    var startTime = performance.now();
    function onDown(e) { dragging = true; var p = e.touches ? e.touches[0] : e; lastX = p.clientX; lastY = p.clientY; }
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
    s.renderer.domElement.style.cursor = "grab";
    s.renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    s.renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    mount.addEventListener("mousemove", function (e) {
      var rect = mount.getBoundingClientRect();
      followX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.25;
      followY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.15;
    });
    mount.addEventListener("mouseleave", function () { followX = 0; followY = 0; });
    var visible = true;
    new IntersectionObserver(function (entries) { entries.forEach(function (e) { visible = e.isIntersecting; }); }, { threshold: 0 }).observe(mount);
    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;
      if (!dragging) targetRotY += 0.004;
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
   * SCENE: THIN — disc edge-on with size annotation; scroll lines up
   * a credit card and a coin next to it for scale comparison.
   * Pure SVG/CSS — fast and crisp.
   * ================================================================= */
  function initSceneThin() {
    var sec = document.querySelector("[data-scene-thin]");
    if (!sec) return;
    var disc = sec.querySelector(".thin-disc");
    var card = sec.querySelector(".thin-card");
    var coin = sec.querySelector(".thin-coin");
    var label = sec.querySelector(".thin-label");
    var raf = null;
    function update() {
      if (!inView(sec)) { raf = null; return; }
      var p = blockProgress(sec);
      // Disc enters from center, slides left
      // Card enters from right
      // Coin enters from far right
      var discX = lerp(0, -180, easeInOutCubic(p));
      var cardX = lerp(800, 0, easeInOutCubic(smoothstep(0.1, 0.6, p)));
      var coinX = lerp(800, 180, easeInOutCubic(smoothstep(0.25, 0.8, p)));
      if (disc) disc.style.transform = "translateX(" + discX + "px)";
      if (card) card.style.transform = "translateX(" + cardX + "px)";
      if (coin) coin.style.transform = "translateX(" + coinX + "px)";
      if (label) label.style.opacity = smoothstep(0.4, 0.7, p);
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * SCENE: HOLO — drag-rotate disc demo
   * ================================================================= */
  function initSceneHolo() {
    if (typeof THREE === "undefined") return;
    var mount = document.querySelector("[data-pw-holo]");
    if (!mount) return;
    var s = makeScene(THREE, mount, { fov: 30, camZ: 4.0, camY: 0.0 });
    if (!s) return;
    var disc = buildDisc(THREE);
    disc.group.rotation.x = -0.3;
    s.scene.add(disc.group);
    var targetRotY = 0, targetRotX = -0.3, curRotY = 0, curRotX = -0.3;
    var dragging = false, lastX = 0, lastY = 0;
    var startTime = performance.now();
    function onDown(e) { dragging = true; var p = e.touches ? e.touches[0] : e; lastX = p.clientX; lastY = p.clientY; }
    function onMove(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      targetRotY += (p.clientX - lastX) * 0.012;
      targetRotX += (p.clientY - lastY) * 0.006;
      targetRotX = clamp(targetRotX, -1.4, 1.4);
      lastX = p.clientX; lastY = p.clientY;
      if (e.touches) e.preventDefault();
    }
    function onUp() { dragging = false; }
    s.renderer.domElement.style.cursor = "grab";
    s.renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    s.renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    s.renderer.domElement.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    var visible = false;
    new IntersectionObserver(function (entries) { entries.forEach(function (e) { visible = e.isIntersecting; }); }, { threshold: 0 }).observe(mount);
    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;
      if (!dragging) targetRotY += 0.005;
      curRotY = lerp(curRotY, targetRotY, 0.15);
      curRotX = lerp(curRotX, targetRotX, 0.15);
      disc.group.rotation.y = curRotY;
      disc.group.rotation.x = curRotX;
      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * SCENE: EMF — chaos→calm shader, scroll-driven
   * ================================================================= */
  function initSceneEMF() {
    if (typeof THREE === "undefined") return;
    var sec = document.querySelector("[data-scene-emf]");
    if (!sec) return;
    var mount = sec.querySelector("[data-pw-canvas]");
    if (!mount) return;
    var s = makeScene(THREE, mount, { fov: 40, camZ: 5.0, darkBG: true });
    if (!s) return;
    var emf = buildEMF(THREE);
    s.scene.add(emf.group);
    var disc = buildDisc(THREE);
    disc.group.scale.setScalar(0.4);
    s.scene.add(disc.group);
    var startTime = performance.now();
    var visible = false;
    new IntersectionObserver(function (entries) { entries.forEach(function (e) { visible = e.isIntersecting; }); }, { threshold: 0 }).observe(sec);
    var chaosLabel = sec.querySelector(".emf-state-label");
    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = (performance.now() - startTime) / 1000;
      disc.holoMat.uniforms.uTime.value = t;
      emf.mat.uniforms.uTime.value = t;
      var p = blockProgress(sec);
      var chaos = lerp(1.0, 0.0, easeInOutCubic(p));
      emf.mat.uniforms.uChaos.value = chaos;
      disc.group.rotation.x = -Math.PI / 2 + Math.sin(t * 0.5) * 0.08;
      disc.group.rotation.z = t * 0.4;
      disc.group.position.y = lerp(2.0, 0.0, easeInOutCubic(p));
      disc.group.scale.setScalar(smoothstep(0.2, 0.7, p) * 0.4);
      emf.group.rotation.y = t * 0.15;
      emf.group.rotation.x = Math.sin(t * 0.3) * 0.08;
      emf.group.scale.setScalar(lerp(1.0, 1.5, smoothstep(0.5, 1.0, p)));
      if (chaosLabel) {
        chaosLabel.textContent = chaos > 0.5 ? "CHAOS" : "CALM";
        chaosLabel.style.color = chaos > 0.5 ? "#ff5a3c" : "#6ec3ff";
      }
      s.renderer.render(s.scene, s.camera);
    }
    tick();
  }

  /* =================================================================
   * SCENE: HARMONISE — wavy distorted circle morphs to perfect circle
   * Pure SVG path, points around a circle distorted by sin waves.
   * Distortion amount lerps from 0.5 → 0 with scroll progress.
   * ================================================================= */
  function initSceneHarmonise() {
    var sec = document.querySelector("[data-scene-harmonise]");
    if (!sec) return;
    var path = sec.querySelector(".harm-path");
    var label = sec.querySelector(".harm-label");
    if (!path) return;
    var raf = null, t0 = performance.now();
    function buildPath(distortion, t) {
      var N = 80;
      var R = 100;
      var d = "";
      for (var i = 0; i <= N; i++) {
        var ang = (i / N) * Math.PI * 2;
        var jitter = Math.sin(ang * 7 + t * 1.2) * 0.6 + Math.sin(ang * 13 - t * 1.7) * 0.3 + Math.sin(ang * 3 + t) * 0.4;
        var r = R * (1 + jitter * distortion);
        var x = Math.cos(ang) * r;
        var y = Math.sin(ang) * r;
        d += (i === 0 ? "M " : "L ") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      }
      d += "Z";
      return d;
    }
    function tick() {
      requestAnimationFrame(tick);
      if (!inView(sec)) return;
      var t = (performance.now() - t0) / 1000;
      var p = blockProgress(sec);
      var distortion = lerp(0.5, 0.0, easeInOutCubic(p));
      path.setAttribute("d", buildPath(distortion, t));
      var pct = Math.round(p * 100);
      if (label) label.textContent = pct + "% harmonised";
    }
    tick();
  }

  /* =================================================================
   * SCENE: DEVICES — disc orbits between device icons on scroll
   * Pure CSS/JS over an SVG layout
   * ================================================================= */
  function initSceneDevices() {
    var sec = document.querySelector("[data-scene-devices]");
    if (!sec) return;
    var orbit = sec.querySelector(".dev-orbit-disc");
    if (!orbit) return;
    var devices = sec.querySelectorAll(".dev-target");
    var raf = null;
    function update() {
      if (!inView(sec)) { raf = null; return; }
      var p = blockProgress(sec);
      // The orbit disc visits each device in sequence
      var n = devices.length;
      var idxF = p * (n - 1);
      var idx0 = Math.floor(idxF);
      var idxFrac = idxF - idx0;
      var d0 = devices[idx0];
      var d1 = devices[Math.min(idx0 + 1, n - 1)];
      var r0 = d0.getBoundingClientRect();
      var r1 = d1.getBoundingClientRect();
      var sr = sec.getBoundingClientRect();
      var x0 = r0.left + r0.width / 2 - sr.left;
      var y0 = r0.top + r0.height / 2 - sr.top;
      var x1 = r1.left + r1.width / 2 - sr.left;
      var y1 = r1.top + r1.height / 2 - sr.top;
      var x = lerp(x0, x1, easeInOutCubic(idxFrac));
      var y = lerp(y0, y1, easeInOutCubic(idxFrac));
      orbit.style.transform = "translate(" + x.toFixed(0) + "px, " + y.toFixed(0) + "px) translate(-50%, -50%) rotate(" + (p * 720).toFixed(0) + "deg)";
      // Mark the current target as "active"
      devices.forEach(function (d, i) {
        d.classList.toggle("is-current", i === idx0 || (idxFrac > 0.5 && i === Math.min(idx0 + 1, n - 1)));
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * SCENE: ALWAYS ON — 24-hour dial with a pulsing dot rotating
   * ================================================================= */
  function initSceneAlwaysOn() {
    var sec = document.querySelector("[data-scene-alwayson]");
    if (!sec) return;
    var dot = sec.querySelector(".alwayson-dot");
    if (!dot) return;
    var t0 = performance.now();
    function tick() {
      requestAnimationFrame(tick);
      if (!inView(sec)) return;
      var t = (performance.now() - t0) / 1000;
      // Rotate the orbiting dot
      var ang = (t * 0.5) % (Math.PI * 2);
      var R = 120;
      var x = Math.cos(ang - Math.PI / 2) * R;
      var y = Math.sin(ang - Math.PI / 2) * R;
      dot.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
    }
    tick();
  }

  /* =================================================================
   * SCENE: STACK — 3 discs stack visually for the 3 packs
   * ================================================================= */
  function initSceneStack() {
    var sec = document.querySelector("[data-scene-stack]");
    if (!sec) return;
    var raf = null;
    function update() {
      if (!inView(sec)) { raf = null; return; }
      var p = blockProgress(sec);
      var discs = sec.querySelectorAll(".stack-disc");
      discs.forEach(function (d, i) {
        var enter = smoothstep(i * 0.25, i * 0.25 + 0.3, p);
        var y = lerp(60, -i * 14, enter);
        var rot = lerp(20 + i * 8, 0, enter);
        d.style.opacity = enter;
        d.style.transform = "translateY(" + y.toFixed(0) + "px) rotate(" + rot.toFixed(1) + "deg)";
      });
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* =================================================================
   * INIT
   * ================================================================= */
  function init() {
    initScrollProgress();
    initScrollReveal();
    initSplitText();
    initCounters();
    initCountdown();
    initBundleSelector();
    initStickyCart();
    initMagnetic();
    initMarqueeParallax();
    initStickerParallax();

    initSceneThin();
    initSceneHarmonise();
    initSceneDevices();
    initSceneAlwaysOn();
    initSceneStack();

    function init3D(attempts) {
      if (typeof THREE !== "undefined") {
        initHero3D();
        initSceneHolo();
        initSceneEMF();
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
