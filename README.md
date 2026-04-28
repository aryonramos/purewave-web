# PureWave — v7

Page got longer, animations got slower, four new demo scenes added. Total page is now ~35,500px tall, roughly 2× v6.

## What changed since v6

### Slower scroll-driven animations
- All scene heights extended by ~50% so the demos breathe:
  - `.scene` 220vh → 340vh (mobile 200vh → 300vh)
  - `.scene.tall` 280vh → 420vh (mobile 240vh → 380vh)
  - `.scene.short` 180vh → 260vh (mobile 160vh → 240vh)
- New `holdProgress()` / `holdAndExitProgress()` helpers — instead of mapping scroll 0→1 linearly, demos now ramp up quickly, **hold at peak in the middle**, then either stay there or wind down. Applied to thin, harmonise, EMF, and stack. Even on a fast scroll the user gets a clear moment with the demo at its peak state.

### Four new demo scenes
1. **Peel & Press** — 3-stage application: striped backing peels off, disc hovers, descends onto a phone outline. Headline: "Peel. Press. Done forever."
2. **Built like jewellery** — exploded view of the disc's 5 construction layers (aerospace gold rim, holographic film, nano-ion silicone core, pattern-etched base, 3M aerospace adhesive), with mono-type labels.
3. **Drag to see the difference** — before/after EMF wipe with a draggable handle. Chaotic red wave on the left, calm blue/gold wave on the right. Auto-wipes with scroll, but draggable.
4. **Tap anywhere to feel it** — interactive ripple field. Tap or click anywhere; ripples emanate from that point and a field of golden dots gets pushed outward. Counter tracks taps.

### Page now reads as 12 scroll-pinned demos
1. Hero — drag-rotate disc
2. **NEW Peel & Press**
3. Thinner than a credit card — scale comparison (now holds at peak)
4. Holographic — drag-rotate
5. **NEW Built like jewellery — exploded layers**
6. From chaos to calm — EMF shader (now holds at calm)
7. **NEW Drag to see the difference — before/after wipe**
8. 100% more harmonised — wavy circle morphs (now holds at perfect)
9. Works on everything — disc orbits device grid
10. No batteries, no charging — 24h dial
11. **NEW Tap anywhere to feel it — ripple field**
12. Pick your stack — three discs stacking (now holds at full stack)

Plus marquees, sticker grid, offer card, reviews, FAQ, final CTA.

## Mobile

All four new scenes verified at 390px viewport. Layer labels stack below each layer on narrow widths instead of beside; ripple uses fewer particles for performance. No JS errors.

## Stack

- Static HTML / CSS / JS, no build step
- Three.js r128 (CDN) for hero, holo, EMF
- Custom GLSL shaders for the disc and EMF wave field
- HTML5 Canvas for the ripple field
- SVG for harmonise, wipe waves, device icons
- CSS-only for peel, layers exploded view, thin comparison, always-on dial, sticker grid, stack
- Fraunces (display) + Inter Tight (body) + IBM Plex Mono (labels)

## Deploying — replace your existing repo

```bash
cd ~/Downloads/purewave-static-v7
git init
git remote add origin https://github.com/aryonramos/purewave-web.git
git fetch
git reset --soft origin/main
git add .
git commit -m "v7 — longer page, slower scroll, four new demo scenes"
git push -f origin main
```

Vercel auto-redeploys in ~30 seconds.

## Local preview

```bash
cd purewave-static-v7
python3 -m http.server 8000
# open http://localhost:8000
```
