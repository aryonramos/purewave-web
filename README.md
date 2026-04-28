# PureWave — v5

Major rework based on direct feedback. The procedural 3D phone is gone — replaced with your actual product photos as the phone backdrop, with 3D disc / EMF waves / shield field rendering on top. Same trick Apple uses on product pages: realistic phone, animated 3D overlay.

## What's new in v5

### Three photo-backed 3D scroll scenes
- **Apply** — close-up phone photo backdrop. 3D disc flies in from upper-right along a curved bezier path, tumbles, and settles into place as you scroll past.
- **EMF (chaos → calm)** — close-up phone backdrop. 3D wave rings emanate outward; the shader transitions from chaotic red/orange/jagged → calm blue/gold/smooth as you scroll. Decorative orbiting disc.
- **Shield Field** — floating phone backdrop. A breathing dotted-sphere "field" of golden particles surrounds the phone, intensifying with scroll progress.

### Scroll moments later in the page (this was the other big request)
- **"By The Numbers" band** between How It Works and the offer — a giant 3D disc tilted edge-on, rotating with scroll, alongside 4 stat counters with gradient bars (98% / 0% / 47K+ / 24/7).
- **3rd marquee band** before reviews ("47,000+ devices · 3,214 reviews · 4.7 stars").
- **4th gold marquee** before the final CTA ("Stop overthinking it · Just press apply").
- **3D floating disc inside the final CTA section** (decorative, right side on desktop, centered above headline on mobile).
- **Magnetic-pull buttons** — primary CTAs now subtly pull toward the cursor on hover (desktop only).
- **Marquees with scroll parallax** — extra horizontal shift based on scroll position, gives them life.
- **Scroll-tied stat bars** that fill on enter view.

### Mobile improvements
- DPR cap lowered to 1.5x on mobile (was 2x) — preserves battery without losing sharpness.
- 3D scenes now run down to 360px width (previously disabled below 480px).
- Feature blocks use a clean stacked grid on mobile; no more flex order conflicts.
- Final CTA's floating disc repositions from right-side decoration to centered hero element on mobile, so it actually shows up.

### Retained from v4
Smooth scroll, top progress bar, scroll reveals, animated counters, bar-fill stat visualizations, sticky cart, live notifications, countdown, bundle selector.

## Deploying — replace your existing repo

```bash
cd ~/Downloads/purewave-static-v5
git init
git remote add origin https://github.com/aryonramos/purewave-web.git
git fetch
git reset --soft origin/main
git add .
git commit -m "v5 — photo-backed 3D scenes, more scroll moments, mobile fixes"
git push -f origin main
```

Vercel auto-redeploys in ~30 seconds.

## Local preview

```bash
cd purewave-static-v5
python3 -m http.server 8000
# open http://localhost:8000
```

## Stack

- Static HTML / CSS / JS — no build step
- Three.js r128 (CDN) for the 3D scenes
- Custom GLSL shaders for the holographic disc, EMF waves, and shield field
- Fraunces + Inter Tight from Google Fonts
- Deploys to Vercel as-is, no config beyond `vercel.json`
