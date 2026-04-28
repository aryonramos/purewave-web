# PureWave — v6

Full redesign in the style of [oryzo.ai](https://oryzo.ai). Every section is a small interactive demo or visual moment, not a wall of copy. The page reads as a series of toys you scroll through.

## Philosophy change

Previous versions explained the product. v6 *demonstrates* it.

| Property | v5 — explained | v6 — demonstrated |
|----------|---------------|-------------------|
| 1.2mm thin | "Aerospace-grade, ultra-slim" | Disc edge-on next to a credit card and a coin, animated |
| Holographic | "Premium gold finish" | Drag-rotate 3D disc, shimmer responds to angle |
| Universal | "Works on phone, laptop, tablet…" | A glowing disc orbits a 3×2 grid of devices, lighting each up |
| 24/7 | "No batteries, no charging" | A 24h dial with a pulsing dot circling it |
| Field harmonisation | "98% measured in lab testing" | Wavy distorted circle morphing to a perfect circle |
| EMF chaos→calm | "Transforms chaotic signal" | Shader-driven wave field, jagged red→smooth blue |
| Three packs | A comparison table | Three discs visually stacking on scroll |
| Stats | A numbers band | Constellation of scattered, slightly-rotated sticker cards |

## What's in the page

1. **Hero** — "Quietly brilliant." + draggable 3D disc + scroll-cue pill
2. **Marquee 1** — "Apply once. Last forever." gold ✦ marquee
3. **Thin demo** — Scroll-driven scale comparison
4. **Holographic demo** — Drag-rotate disc with shader shimmer
5. **Marquee 2 (gold)** — "One disc. Every device."
6. **EMF scene** — Dark theme, chaos→calm shader transition
7. **Harmonise scene** — SVG circle morphs from jagged to perfect
8. **Devices scene** — Disc orbits a 3×2 grid, each card lights up
9. **Always-on** — 24h dial with orbiting glowing dot
10. **Sticker grid** — 7 scattered stat cards, mixed dark/gold/cream
11. **Marquee 3** — "Pick your stack."
12. **Stack scene** — Three discs visually stack
13. **Offer card** — Bundle picker, countdown, payment badges
14. **Reviews** — Visual sticker cards (cream/gold/dark), short italic quotes
15. **FAQ** — Accordion, 6 items
16. **Final CTA** — "Stop overthinking." + gold CTA

## Mobile

Verified screenshots at 390px viewport. Every demo runs:
- Hero disc renders at full quality
- Devices grid converts to 2×3
- Always-on dial scales down preserving ticks
- Sticker grid uses 2 columns; numbers clamp to viewport width to prevent overflow
- DPR capped at 1.5x to save battery

## Stack

- Static HTML / CSS / JS — no build step
- Three.js r128 (CDN) for hero, holo, EMF scenes
- Custom GLSL shaders for the holographic disc, EMF wave field
- SVG / CSS for thin, harmonise, devices, always-on, stack scenes
- Fraunces (display) + Inter Tight (body) + IBM Plex Mono (labels)
- Deploys to Vercel as-is

## Deploying — replace your existing repo

```bash
cd ~/Downloads/purewave-static-v6
git init
git remote add origin https://github.com/aryonramos/purewave-web.git
git fetch
git reset --soft origin/main
git add .
git commit -m "v6 — demo-driven redesign"
git push -f origin main
```

Vercel auto-redeploys in ~30 seconds.

## Local preview

```bash
cd purewave-static-v6
python3 -m http.server 8000
# open http://localhost:8000
```
